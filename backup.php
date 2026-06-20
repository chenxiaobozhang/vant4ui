<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$host = '127.0.0.1';
$user = 'root';
$pass = 'root';
$dbname = 'hudie_backup_db';

try {
    $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbname` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `$dbname`");
    
    // Auto-migration: Check if table u_scheme_backups has old column `backup_key`
    $migrate = false;
    $tableExists = $pdo->query("SHOW TABLES LIKE 'u_scheme_backups'")->rowCount() > 0;
    if ($tableExists) {
        $columns = $pdo->query("DESCRIBE `u_scheme_backups`")->fetchAll();
        foreach ($columns as $col) {
            if (strtolower($col['Field']) === 'backup_key') {
                $migrate = true;
                break;
            }
        }
    }
    
    if ($migrate) {
        $pdo->exec("DROP TABLE IF EXISTS `u_scheme_backups`");
    }
    
    // Create tables
    $pdo->exec("CREATE TABLE IF NOT EXISTS `u_scheme_passwords` (
        `card` VARCHAR(100) PRIMARY KEY,
        `password` VARCHAR(255) NOT NULL,
        `updated_at` DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    
    $pdo->exec("CREATE TABLE IF NOT EXISTS `u_scheme_backups` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `card` VARCHAR(100) NOT NULL,
        `config_name` VARCHAR(100) NOT NULL,
        `configs` LONGTEXT NOT NULL,
        `updated_at` DATETIME NOT NULL,
        UNIQUE KEY `card_config` (`card`, `config_name`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    
} catch (Exception $e) {
    echo json_encode([
        'code' => 500,
        'msg' => '数据库连接或初始化失败: ' . $e->getMessage()
    ]);
    exit;
}

// Helper password functions
function verifyHash($password, $hash) {
    if (function_exists('password_verify')) {
        return password_verify($password, $hash);
    }
    return md5($password) === $hash || $password === $hash;
}

function hashPassword($password) {
    if (function_exists('password_hash')) {
        return password_hash($password, PASSWORD_DEFAULT);
    }
    return md5($password);
}

// Parse request data
$action = $_GET['action'] ?? '';
$input = file_get_contents('php://input');
$data = json_decode($input, true) ?? [];

// Helper to get parameters from POST/GET
$card = trim($data['init_card'] ?? $data['card'] ?? $_GET['init_card'] ?? $_GET['card'] ?? '');
$password = trim($data['password'] ?? $_GET['password'] ?? '');

if (empty($card)) {
    echo json_encode(['code' => 400, 'msg' => '卡密不能为空']);
    exit;
}

// Password verification helper
function checkPassword($pdo, $card, $password, &$msg) {
    if (empty($password)) {
        $msg = '密码不能为空';
        return false;
    }
    $stmt = $pdo->prepare("SELECT `password` FROM `u_scheme_passwords` WHERE `card` = :card");
    $stmt->execute(['card' => $card]);
    $row = $stmt->fetch();
    if (!$row) {
        // First time, register password
        $hashed = hashPassword($password);
        $stmt_ins = $pdo->prepare("INSERT INTO `u_scheme_passwords` (`card`, `password`, `updated_at`) VALUES (:card, :password, NOW())");
        $stmt_ins->execute(['card' => $card, 'password' => $hashed]);
        return true;
    }
    if (verifyHash($password, $row['password'])) {
        return true;
    }
    $msg = '密码验证失败，请重新输入';
    return false;
}

if ($action === 'verify_password') {
    $msg = '';
    if (checkPassword($pdo, $card, $password, $msg)) {
        echo json_encode(['code' => 200, 'msg' => '密码验证成功']);
    } else {
        echo json_encode(['code' => 403, 'msg' => $msg]);
    }
    exit;
}

if ($action === 'change_password') {
    $newPassword = trim($data['new_password'] ?? '');
    if (empty($newPassword)) {
        echo json_encode(['code' => 400, 'msg' => '新密码不能为空']);
        exit;
    }
    $msg = '';
    // If password is already set, we verify the old password first
    $stmt = $pdo->prepare("SELECT `password` FROM `u_scheme_passwords` WHERE `card` = :card");
    $stmt->execute(['card' => $card]);
    $row = $stmt->fetch();
    if ($row) {
        if (!verifyHash($password, $row['password'])) {
            echo json_encode(['code' => 403, 'msg' => '原密码验证失败']);
            exit;
        }
    }
    // Update password
    $hashed = hashPassword($newPassword);
    $stmt_upd = $pdo->prepare("INSERT INTO `u_scheme_passwords` (`card`, `password`, `updated_at`) 
        VALUES (:card, :password, NOW()) 
        ON DUPLICATE KEY UPDATE `password` = :password_update, `updated_at` = NOW()");
    $stmt_upd->execute([
        'card' => $card,
        'password' => $hashed,
        'password_update' => $hashed
    ]);
    echo json_encode(['code' => 200, 'msg' => '密码修改成功']);
    exit;
}

// For all other actions, we must verify the password
$msg = '';
if (!checkPassword($pdo, $card, $password, $msg)) {
    echo json_encode(['code' => 403, 'msg' => $msg]);
    exit;
}

if ($action === 'upload') {
    // Determine configs and config_name
    $config_name = '';
    $configs = '';
    
    if (isset($data['single_scheme'])) {
        $config_name = trim($data['single_scheme']['name'] ?? '');
        $configs = json_encode($data['single_scheme']['data'] ?? [], JSON_UNESCAPED_UNICODE);
    } else {
        $config_name = trim($data['config_name'] ?? '');
        $configs = is_array($data['configs'] ?? null) ? json_encode($data['configs'], JSON_UNESCAPED_UNICODE) : ($data['configs'] ?? '');
    }
    
    if (empty($config_name)) {
        echo json_encode(['code' => 400, 'msg' => '配置名称不能为空']);
        exit;
    }
    if (empty($configs)) {
        echo json_encode(['code' => 400, 'msg' => '配置内容不能为空']);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("INSERT INTO `u_scheme_backups` (`card`, `config_name`, `configs`, `updated_at`) 
            VALUES (:card, :config_name, :configs, NOW()) 
            ON DUPLICATE KEY UPDATE `configs` = :configs_update, `updated_at` = NOW()");
        $stmt->execute([
            'card' => $card,
            'config_name' => $config_name,
            'configs' => $configs,
            'configs_update' => $configs
        ]);
        
        echo json_encode(['code' => 200, 'msg' => '备份成功']);
    } catch (Exception $e) {
        echo json_encode(['code' => 500, 'msg' => '备份写入失败: ' . $e->getMessage()]);
    }
    exit;
}

if ($action === 'download') {
    try {
        $stmt = $pdo->prepare("SELECT `config_name`, `configs`, `updated_at` FROM `u_scheme_backups` WHERE `card` = :card");
        $stmt->execute(['card' => $card]);
        $rows = $stmt->fetchAll();
        
        $configList = [];
        $lastUpdateTime = '';
        $maxTime = 0;
        foreach ($rows as $row) {
            $ts = strtotime($row['updated_at']);
            if ($ts > $maxTime) {
                $maxTime = $ts;
                $lastUpdateTime = $row['updated_at'];
            }
            $configList[] = [
                'name' => $row['config_name'],
                'data' => json_decode($row['configs'], true),
                'updatedAt' => $ts * 1000
            ];
        }
        
        $payload = [
            'configList' => $configList,
            'activeConfigIndex' => 0,
            'recycleBin' => []
        ];
        
        echo json_encode([
            'code' => 200,
            'msg' => '下载备份成功',
            'data' => json_encode($payload, JSON_UNESCAPED_UNICODE),
            'updated_at' => $lastUpdateTime
        ], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        echo json_encode(['code' => 500, 'msg' => '读取云端备份失败: ' . $e->getMessage()]);
    }
    exit;
}

if ($action === 'list') {
    try {
        $stmt = $pdo->prepare("SELECT `config_name`, `configs`, `updated_at` FROM `u_scheme_backups` WHERE `card` = :card ORDER BY `updated_at` DESC");
        $stmt->execute(['card' => $card]);
        $rows = $stmt->fetchAll();
        
        echo json_encode([
            'code' => 200,
            'msg' => '获取备份列表成功',
            'data' => $rows
        ], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        echo json_encode(['code' => 500, 'msg' => '获取备份列表失败: ' . $e->getMessage()]);
    }
    exit;
}

if ($action === 'delete_single') {
    $name = trim($data['name'] ?? $data['config_name'] ?? '');
    if (empty($name)) {
        echo json_encode(['code' => 400, 'msg' => '要删除的方案名称不能为空']);
        exit;
    }
    try {
        $stmt = $pdo->prepare("DELETE FROM `u_scheme_backups` WHERE `card` = :card AND `config_name` = :name");
        $stmt->execute(['card' => $card, 'name' => $name]);
        echo json_encode(['code' => 200, 'msg' => '删除成功']);
    } catch (Exception $e) {
        echo json_encode(['code' => 500, 'msg' => '删除失败: ' . $e->getMessage()]);
    }
    exit;
}

if ($action === 'delete') {
    try {
        $stmt = $pdo->prepare("DELETE FROM `u_scheme_backups` WHERE `card` = :card");
        $stmt->execute(['card' => $card]);
        echo json_encode(['code' => 200, 'msg' => '已成功清空云端备份！']);
    } catch (Exception $e) {
        echo json_encode(['code' => 500, 'msg' => '清空失败: ' . $e->getMessage()]);
    }
    exit;
}

echo json_encode(['code' => 400, 'msg' => '无效的操作']);
