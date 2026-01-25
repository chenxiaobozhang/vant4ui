<template>
  <div class="log-manager">
    <div class="top-action-bar" fixed z-index="1000">
      <van-button size="small" @click="checkAll">全选</van-button>
      <van-button size="small" @click="toggleAll">反选</van-button>
      <van-button size="small" type="danger" icon="delete-o" :disabled="!checkedIds.length"
        @click="batchDelete">批量删除</van-button>
      <van-button size="small" type="primary" icon="upgrade" :disabled="!checkedIds.length"
        @click="batchUpload">批量上传</van-button>
      <div class="selected-count">已选 {{ checkedIds.length }} 项</div>
    </div>

    <div class="list-wrapper">
      <van-checkbox-group v-model="checkedIds" ref="checkboxGroup">
        <van-cell v-for="(item, index) in logs" :key="item.id" center @click="toggle(item.id)">
          <template #icon>
            <van-checkbox :name="item.id" @click.stop ref="checkboxes" style="margin-right: 12px" shape="square" />
          </template>
          <template #title>
            <span class="log-id">ID: {{ item.id }}--</span>
            <span class="log-name">{{ item.name }}</span>
            <van-tag type="primary" plain style="margin-left: 8px">{{ formatSize(item.size) }}</van-tag>
          </template>
        </van-cell>
      </van-checkbox-group>

      <van-empty v-if="logs.length === 0" description="暂无日志数据" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { showConfirmDialog, showToast, showSuccessToast } from 'vant';

const props = defineProps({
  logData: {
    type: Array,
    default: () => []
  }
});

const logs = ref([...props.logData]);

watch(() => props.logData, (newVal) => {
  logs.value = [...newVal];
}, { deep: true });


const checkedIds = ref([]); // 存储选中的 ID
const checkboxGroup = ref(null);

const formatSize = (sizeStr, decimals = 2) => {
  // 处理各种输入
  const size = Number(sizeStr);
  if (isNaN(size) || size < 0) return '0 B';
  if (size === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const base = 1024;
  const index = Math.floor(Math.log(size) / Math.log(base));

  // 限制最大单位
  const safeIndex = Math.min(index, units.length - 1);

  // 格式化数字，移除不必要的尾随零
  const formattedSize = parseFloat((size / Math.pow(base, safeIndex)).toFixed(decimals));

  return formattedSize + ' ' + units[safeIndex];
};

// 切换选中状态
const toggle = (id) => {
  const index = checkedIds.value.indexOf(id);
  if (index > -1) {
    checkedIds.value.splice(index, 1);
  } else {
    checkedIds.value.push(id);
  }
};

// --- 批量功能 ---

// 全选
const checkAll = () => {
  checkedIds.value = logs.value.map(item => item.id);
};

// 反选
const toggleAll = () => {
  const allIds = logs.value.map(item => item.id);
  checkedIds.value = allIds.filter(id => !checkedIds.value.includes(id));
};

// 批量删除
const batchDelete = () => {
  showConfirmDialog({
    title: '批量删除确认',
    message: `确定要删除选中的 ${checkedIds.value.length} 条记录吗？`,
  }).then(() => {
    logs.value = logs.value.filter(item => !checkedIds.value.includes(item.id));
    checkedIds.value = []; // 清空选中
    showSuccessToast('批量删除成功');
  });
};

// 批量上传
const batchUpload = () => {
  showToast(`正在上传 ${checkedIds.value.length} 条数据...`);
  setTimeout(() => {
    showSuccessToast('上传完成');
    checkedIds.value = []; // 上传后通常清空选中
  }, 1500);
};

</script>

<style scoped>
.log-manager {
  min-height: 44px;
  background-color: #f7f8fa;
  padding-bottom: 8px;
  /* 为底部操作栏留出空间 */
}

.list-wrapper {
  margin-top: 8px;
}

.log-id {
  font-weight: bold;
}

/* 滑动按钮样式 */
.action-btn {
  height: 100%;
}

/* 顶部操作栏 */
.top-action-bar {
  background: #fff;
  padding: 10px 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
}


.top-action-bar .van-button {
  margin-right: 8px;
  padding: 0 15px;
}

.selected-count {
  margin-left: auto;
  margin-right: 50px;
  font-size: 13px;
  color: #646566;
}

.bottom-btns {
  display: flex;
  gap: 12px;
}

:deep(.van-cell) {
  align-items: center;
}
</style>