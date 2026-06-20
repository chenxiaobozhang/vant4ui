<template>
  <div class="log-manager">
    <!-- Fixed Action Bar -->
    <div class="top-action-bar">
      <van-button size="small" @click="checkAll">全选</van-button>
      <van-button size="small" @click="toggleAll">反选</van-button>
      <van-button size="small" type="danger" icon="delete-o" :disabled="!checkedIds.length"
        @click="batchDelete">批量删除</van-button>
      <van-button size="small" type="primary" icon="upgrade" :disabled="!checkedIds.length"
        @click="batchUpload">批量上传</van-button>
      <div class="selected-count">已选 {{ checkedIds.length }}/{{ logs.length }} 项</div>
    </div>

    <!-- Scrollable List Area -->
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
import { ref, onMounted } from 'vue';
import { showConfirmDialog, showToast, showSuccessToast } from 'vant';
import { Webview, _debug } from '../public.js';

const logs = ref([]);
const checkedIds = ref([]);
const checkboxGroup = ref(null);

const showLogs = (logsTable) => {
  _debug("showLogs");
  _debug(logsTable);
  logs.value = logsTable || [];
};

const fetchLogs = () => {
  if (window.bridge || window.webView) {
    Webview.callLua('getLogs');
  } else {
    // Mock data for local testing
    logs.value = [
      { id: 1, name: '运行日志_20260619.txt', size: '12584' },
      { id: 2, name: '错误日志_20260619.txt', size: '4521' }
    ];
  }
};

onMounted(() => {
  Webview.register("showLogs", showLogs);
  fetchLogs();
});

const formatSize = (sizeStr, decimals = 2) => {
  const size = Number(sizeStr);
  if (isNaN(size) || size < 0) return '0 B';
  if (size === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const base = 1024;
  const index = Math.floor(Math.log(size) / Math.log(base));
  const safeIndex = Math.min(index, units.length - 1);
  const formattedSize = parseFloat((size / Math.pow(base, safeIndex)).toFixed(decimals));
  return formattedSize + ' ' + units[safeIndex];
};

const toggle = (id) => {
  const index = checkedIds.value.indexOf(id);
  if (index > -1) {
    checkedIds.value.splice(index, 1);
  } else {
    checkedIds.value.push(id);
  }
};

const checkAll = () => {
  checkedIds.value = logs.value.map(item => item.id);
};

const toggleAll = () => {
  const allIds = logs.value.map(item => item.id);
  checkedIds.value = allIds.filter(id => !checkedIds.value.includes(id));
};

const batchDelete = () => {
  showConfirmDialog({
    title: '批量删除确认',
    message: `确定要删除选中的 ${checkedIds.value.length} 条记录吗？`,
  }).then(() => {
    const selectedItems = logs.value.filter(item => checkedIds.value.includes(item.id));
    if (window.bridge || window.webView) {
      Webview.callLua("deleteLogs", selectedItems);
    }
    logs.value = logs.value.filter(item => !checkedIds.value.includes(item.id));
    checkedIds.value = [];
    showSuccessToast('批量删除成功');
  }).catch(() => {});
};

const batchUpload = () => {
  const selectedItems = logs.value.filter(item => checkedIds.value.includes(item.id));
  showToast(`正在上传 ${checkedIds.value.length} 条数据...`);
  if (window.bridge || window.webView) {
    Webview.callLua("uploadLogs", selectedItems);
  }
  checkedIds.value = [];
};
</script>

<style scoped>
.log-manager {
  min-height: 44px;
  background-color: #f7f8fa;
  padding-bottom: 8px;
}
.list-wrapper {
  margin-top: 8px;
}
.log-id {
  font-weight: bold;
}
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
:deep(.van-cell) {
  align-items: center;
}
</style>