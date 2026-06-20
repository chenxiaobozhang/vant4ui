<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$host = '127.0.0.1';
$user = 'root';
$pass = 'root';
$dbname = 'hudie_backup_db'; // 备份专用的数据库名

try {
    // 1. 先尝试连接数据库（不指定dbname，确保能连上MySQL）
    $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    
    // 2. 创建数据库（如果不存在）
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbname` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `$dbname`");
    
    // 3. 创建备份表（如果不存在）
    $pdo->exec("CREATE TABLE IF NOT EXISTS `u_scheme_backups` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `backup_key` VARCHAR(100) NOT NULL UNIQUE,
        `content` LONGTEXT NOT NULL,
        `updated_at` DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    
} catch (Exception $e) {
    echo json_encode([
        'code' => 500,
        'msg' => '数据库连接或初始化失败: ' . $e->getMessage()
    ]);
    exit;
}

// 获取请求操作
$action = $_GET['action'] ?? '';

if ($action === 'upload') {
    // 备份到服务器
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    $backupKey = trim($data['backup_key'] ?? '');
    $content = $data['content'] ?? '';
    
    if (empty($backupKey)) {
        echo json_encode(['code' => 400, 'msg' => '备份标识（卡密）不能为空']);
        exit;
    }
    
    if (empty($content)) {
        echo json_encode(['code' => 400, 'msg' => '备份内容不能为空']);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("INSERT INTO `u_scheme_backups` (`backup_key`, `content`, `updated_at`) 
            VALUES (:key, :content, NOW()) 
            ON DUPLICATE KEY UPDATE `content` = :content_update, `updated_at` = NOW()");
        $stmt->execute([
            'key' => $backupKey,
            'content' => $content,
            'content_update' => $content
        ]);
        
        echo json_encode(['code' => 200, 'msg' => '备份上传成功']);
    } catch (Exception $e) {
        echo json_encode(['code' => 500, 'msg' => '备份写入失败: ' . $e->getMessage()]);
    }
    exit;
}

if ($action === 'download') {
    // 从服务器下载
    $backupKey = trim($_GET['backup_key'] ?? '');
    
    if (empty($backupKey)) {
        echo json_encode(['code' => 400, 'msg' => '备份标识（卡密）不能为空']);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("SELECT `content` FROM `u_scheme_backups` WHERE `backup_key` = :key");
        $stmt->execute(['key' => $backupKey]);
        $row = $stmt->fetch();
        
        if ($row) {
            echo json_encode([
                'code' => 200,
                'msg' => '下载备份成功',
                'data' => $row['content']
            ]);
        } else {
            echo json_encode(['code' => 404, 'msg' => '未找到该卡密对应的云端备份记录']);
        }
    } catch (Exception $e) {
        echo json_encode(['code' => 500, 'msg' => '读取云端备份失败: ' . $e->getMessage()]);
    }
    exit;
}

echo json_encode(['code' => 400, 'msg' => '无效的操作']);
