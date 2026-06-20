<script setup>
import { ref, toRaw, reactive, onMounted, onUnmounted, watch, computed, h } from 'vue';
import { showDialog, Field, showToast, showSuccessToast, showFailToast } from 'vant';
import { callLuaFun, lua2js, js2lua, Webview } from './public.js';
// 1. 引入 Logs 组件
// 注意：路径需根据你的实际位置调整，@ 通常指向 src 目录
import Logs from './components/Logs.vue';
import Transfer from './components/Transfer.vue';

// --- 1. 基础配置与默认数据 ---
const STORAGE_LIST_KEY = 'UI_CONFIG_LIST';
const STORAGE_INDEX_KEY = 'UI_CONFIG_ACTIVE_INDEX';

const defaultData = window.UI_DATA?.defaultData || {};

const appTitle = window.UI_DATA?.appTitle || "蝴蝶";



// 辅助函数：深度克隆 [cite: 7, 13]
const createNewData = () => JSON.parse(JSON.stringify(defaultData));
// 存储远程传来的数据
const remoteData = ref({});

// --- 2. 多配置管理逻辑 ---
const showActionSheet = ref(false);

const getInitialList = () => {
  const local = localStorage.getItem(STORAGE_LIST_KEY);
  if (local) {
    try {
      const list = JSON.parse(local);
      // 确保新增加的配置字段（如 countdownTime）能够合并到旧数据中
      const def = createNewData();
      list.forEach(item => {
        // 使用 Object.assign 或者解构赋值来确保默认值存在
        // 注意：这里简单合并，如果用户删除了某些字段可能被重置，但对于新增字段是必要的
        item.data = { ...def, ...item.data };
      });
      return list;
    } catch (e) { console.error(e); }
  }
  return [{ name: '默认方案', data: createNewData() }];
};

const configList = reactive(getInitialList());
const activeConfigIndex = ref(Number(localStorage.getItem(STORAGE_INDEX_KEY)) || 0);

// formData 动态指向当前选中的配置 [cite: 8]
const formData = computed(() => configList[activeConfigIndex.value]?.data || {});

const saveAllToLocal = () => {
  localStorage.setItem(STORAGE_LIST_KEY, JSON.stringify(toRaw(configList)));
  localStorage.setItem(STORAGE_INDEX_KEY, activeConfigIndex.value);
  // 同步保存多方案配置到 Native 端
  Webview.callLua("saveAllConfigs", toRaw(configList), activeConfigIndex.value, []);
};

// --- 3. 方案操作函数 (修复 Promise Cancel 报错) ---
const switchConfig = (index) => {
  activeConfigIndex.value = index;
  // 切换配置时，如果有远程数据，也需要合并 [cite: user request]
  if (Object.keys(remoteData.value).length > 0) {
    Object.assign(configList[index].data, remoteData.value);
  }
  saveAllToLocal();
  showActionSheet.value = false;
};

const addNewConfig = () => {
  if (configList.length >= (window.UI_DATA?.configsLimit || 20)) {
    return showDialog({ message: '方案数量已达上限' });
  }
  let newName = `方案 ${configList.length + 1}`;
  showDialog({
    title: '新建方案',
    showCancelButton: true,
    message: () => h('div', { style: 'padding: 20px;' }, [
      h(Field, {
        modelValue: newName,
        'onUpdate:modelValue': (val) => (newName = val),
        placeholder: '请输入方案名称',
        border: true,
        autofocus: true
      })
    ]),
  }).then((action) => {
    if (action === 'confirm') {
      configList.push({
        name: newName.trim() || '未命名方案',
        data: createNewData()
      });
      activeConfigIndex.value = configList.length - 1;
      if (Object.keys(remoteData.value).length > 0) {
        Object.assign(configList[activeConfigIndex.value].data, remoteData.value);
      }
      saveAllToLocal();
    }
  }).catch(() => { }); // 捕获取消操作，防止控制台报错 [cite: 12, 13]
};

const renameConfig = (index) => {
  let currentName = configList[index].name;
  showDialog({
    title: '重命名',
    showCancelButton: true,
    message: () => h('div', { style: 'padding: 20px;' }, [
      h(Field, {
        modelValue: currentName,
        'onUpdate:modelValue': (val) => (currentName = val),
        placeholder: '请输入新名称',
        border: true,
        autofocus: true
      })
    ]),
  }).then((action) => {
    if (action === 'confirm' && currentName.trim()) {
      configList[index].name = currentName.trim();
      saveAllToLocal();
    }
  }).catch(() => { }); // 捕获取消操作 [cite: 15, 16]
};

const deleteConfig = (index) => {
  if (configList.length <= 1) return showDialog({ message: '至少保留一个方案' });
  showDialog({
    title: '确认删除',
    message: `确定要删除 [${configList[index].name}] 吗？`,
    showCancelButton: true
  }).then((action) => {
    if (action === 'confirm') {
      configList.splice(index, 1);
      if (activeConfigIndex.value >= configList.length) activeConfigIndex.value = 0;
      saveAllToLocal();
    }
  }).catch(() => { }); // 捕获取消操作 [cite: 18]
};

const copyConfig = (index) => {
  if (configList.length >= (window.UI_DATA?.configsLimit || 20)) {
    return showDialog({ message: '方案数量已达上限' });
  }

  const sourceConfig = configList[index];
  let newName = `${sourceConfig.name} 副本`;

  showDialog({
    title: '复制方案',
    showCancelButton: true,
    message: () => h('div', { style: 'padding: 20px;' }, [
      h(Field, {
        modelValue: newName,
        'onUpdate:modelValue': (val) => (newName = val),
        placeholder: '请输入新方案名称',
        border: true,
        autofocus: true
      })
    ]),
  }).then((action) => {
    if (action === 'confirm') {
      configList.push({
        name: newName.trim() || '未命名副本',
        data: JSON.parse(JSON.stringify(sourceConfig.data))
      });
      // 自动切换到新复制的方案
      activeConfigIndex.value = configList.length - 1;
      saveAllToLocal();
      showActionSheet.value = false; // 关闭弹窗
    }
  }).catch(() => { });
};

// --- 4. 选择器逻辑 ---
const getPickerText = (item) => {
  const val = formData.value[item.key];
  const option = item.options?.find(opt => opt.value === val);
  return option ? option.text : val;
};

const showPicker = ref(false);
const currentPickerItem = ref({});

const onOpenPicker = (item) => {
  currentPickerItem.value = item;
  showPicker.value = true;
};

const onConfirmPicker = ({ selectedOptions }) => {
  formData.value[currentPickerItem.value.key] = selectedOptions[0].value;
  showPicker.value = false;
};

// --- 5. 时间选择器逻辑 ---
const timePicker_format = (type, option) => {
  if (type === 'hour') option.text += '时';
  if (type === 'minute') option.text += '分';
  return option;
};

const tempStartTime = ref(['08', '00']);
const tempEndTime = ref(['10', '00']);
const showTimePicker = ref(false);
const currentTimeItem = ref({});

const onOpenTimeRange = (item) => {
  currentTimeItem.value = item;
  const startVal = formData.value[item.startKey];
  const endVal = formData.value[item.endKey];
  tempStartTime.value = Array.isArray(startVal) ? [...startVal] : (typeof startVal === 'string' && startVal ? startVal.split(':') : ['08', '00']);
  tempEndTime.value = Array.isArray(endVal) ? [...endVal] : (typeof endVal === 'string' && endVal ? endVal.split(':') : ['10', '00']);
  showTimePicker.value = true;
};

const onConfirmTimePicker = () => {
  const item = currentTimeItem.value;
  if (tempStartTime.value.join(':') >= tempEndTime.value.join(':')) {
    return showDialog({ message: '结束时间必须晚于开始时间' }).catch(() => { });
  }
  formData.value[item.startKey] = [...tempStartTime.value];
  formData.value[item.endKey] = [...tempEndTime.value];
  showTimePicker.value = false;
};

// --- 5.1 Transfer 弹窗逻辑 ---
const showTransferPopup = ref(false);
const currentTransferItem = ref({});
const tempTransferValue = ref([]);

const onOpenTransfer = (item) => {
  currentTransferItem.value = item;
  tempTransferValue.value = [...(formData.value[item.key] || [])];
  showTransferPopup.value = true;
};

const onConfirmTransfer = () => {
  formData.value[currentTransferItem.value.key] = [...tempTransferValue.value];
  showTransferPopup.value = false;
};

const getTransferText = (item) => {
  const selectedVals = formData.value[item.key] || [];
  if (selectedVals.length === 0) return '';
  const options = Array.isArray(item.options) ? item.options : (formData.value[item.options] || []);
  if (selectedVals.length > 3) {
    return `已选择 ${selectedVals.length} 项`;
  }
  return selectedVals.map(val => {
    const opt = options.find(o => o.value === val);
    return opt ? opt.text : val;
  }).join(', ');
};

// --- 6. UI 配置数据 ---
const activeTab = ref(window.UI_DATA?.activeTab || 0);
// const tabsConfig 移除，直接使用 settingGroups 中的结构

const settingGroups = window.UI_DATA?.settingGroups || [];

const activeNames = ref(['1', '3', '4', '5']);
const searchText = ref('');

// 计算属性：过滤后的 Tabs 结构
const filteredTabs = computed(() => {
  const keyword = searchText.value.trim().toLowerCase();
  if (!keyword) return settingGroups;

  return settingGroups.map(tab => {
    // 如果 Tab 是组件类型（如 Logs），直接返回，不需要过滤 Groups
    if (tab.component) return { ...tab };

    if (!tab.groups) return null;
    // 过滤 Tab 下的 Groups
    const matchedGroups = tab.groups.map(group => {
      if (!group) return null;
      const groupTitle = group.title ? String(group.title) : '';
      const isGroupTitleMatch = groupTitle.toLowerCase().includes(keyword);

      // 过滤 Group 下的 Items
      const items = group.items || [];
      const matchedItems = items.filter(item => {
        const itemLabel = item.label ? String(item.label) : '';
        return itemLabel.toLowerCase().includes(keyword);
      });

      if (isGroupTitleMatch) return { ...group }; // Group 标题匹配，显示整个 Group
      if (matchedItems.length > 0) return { ...group, items: matchedItems }; // Items 匹配，显示匹配的 Items
      return null;
    }).filter(Boolean);

    // 如果 Tab 下有匹配的 Group，则返回该 Tab
    if (matchedGroups.length > 0) {
      return { ...tab, groups: matchedGroups };
    }
    return null;
  }).filter(Boolean);
});

// 监听搜索，自动跳转到第一个匹配项
watch(searchText, (val) => {
  if (!val.trim() || filteredTabs.value.length === 0) return;

  // 展开所有匹配的 Groups
  const allGroupNames = filteredTabs.value.flatMap(tab => (tab.groups || []).map(g => g.name));
  activeNames.value = [...new Set([...activeNames.value, ...allGroupNames])];

  // 切换到第一个有结果的 Tab
  // 原始 settingGroups 对应的索引
  const firstMatchedTab = filteredTabs.value[0];
  if (firstMatchedTab) {
    const firstMatchedTabTitle = firstMatchedTab.title;
    const originalIndex = settingGroups.findIndex(tab => tab.title === firstMatchedTabTitle);
    if (originalIndex !== -1) activeTab.value = originalIndex;
  }
});


// --- 7. 倒计时与静默保存逻辑 ---
// 初始化倒计时：优先使用 formData 中的配置，否则默认 30
const getInitialCountdown = () => {
  // formData 是 computed，此时可能还未准备好，或者已经准备好。
  // 但在 setup 阶段 configList 及其 activeConfigIndex 已经有值。
  // 我们直接读取 configList 中当前方案的数据。
  const currentData = configList[activeConfigIndex.value]?.data;
  return (currentData && currentData.countdownTime) ? Number(currentData.countdownTime) : 30;
};
const countdown = ref(getInitialCountdown());
const showCountdownBtn = ref(true);
let timer = null;

const handleReload = () => {
  window.location.reload();
};
const handleSave = () => {
  saveAllToLocal();
  Webview.callLua("saveSettings", formData.value);
};
const stopCountdown = () => {
  if (timer) clearInterval(timer);
  showCountdownBtn.value = false;
};
const handleNext = () => {
  saveAllToLocal();
  console.log(toRaw(formData.value));
  if (timer) clearInterval(timer);
  Webview.callLua("startTask", formData.value);
  if (window.bridge && typeof window.bridge.confirm === "function") {
    window.bridge.confirm(); // 关闭窗口
  }
};
const handleExit = () => {
  Webview.callLua("exitUI");
  if (window.bridge && typeof window.bridge.confirm === "function") {
    window.bridge.confirm(); // 关闭窗口
  }
};




const showLogsPopup = ref(false);
const currentLogsData = ref([]);

const handleButtonClick = (item) => {
  if (item.key === 'openLogs') {
    // 模拟从 JSON 初始化数据
    currentLogsData.value = [
      { id: 1, timestamp: '2023-10-27 10:00:01', name: '2023年10月27日10时00分01秒', size: '12584' },
      { id: 2, timestamp: '2023-10-27 11:20:15', name: '2023年10月27日11时20分15秒', size: '4521' },
      { id: 3, timestamp: '2023-10-27 14:05:33', name: '2023年10月27日14时05分33秒', size: '89000' },
      { id: 4, timestamp: '2023-10-28 09:12:00', name: '2023年10月28日09时12分00秒', size: '1200000' },
      { id: 5, timestamp: '2023-10-28 10:30:45', name: '2023年10月28日10时30分45秒', size: '33210' }
    ];
    showLogsPopup.value = true;
  } else if (item.key === 'a') {
    console.log('a');
  }
};


// 新增一个纯粹的解析函数（给模板用）
const parseText = (text) => {
  if (!text || typeof text !== 'string' || !text.includes('${')) return text;
  // 优化正则：支持 ${a.b} 这种多级取值
  return text.replace(/\$\{([\w\.]+)\}/g, (_, key) => {
    const val = key.split('.').reduce((o, k) => (o || {})[k], constData.value);
    return val !== undefined ? val : '';
  });
};
const constData = ref({}); // 全局响应式数据
const jsInitData = (payload) => {
  console.log("[App] jsInitData payload:", payload);
  try {
    if (payload && typeof payload === 'object') {
      if (payload.configList && Array.isArray(payload.configList)) {
        configList.length = 0;
        payload.configList.forEach(item => configList.push(item));
      }
      if (payload.activeConfigIndex !== undefined) {
        activeConfigIndex.value = payload.activeConfigIndex;
      }
      if (!payload.configList && payload.formData) {
        Object.assign(formData.value, payload.formData);
        remoteData.value = payload.formData;
      } else if (payload.configList && payload.configList[payload.activeConfigIndex]) {
        remoteData.value = payload.configList[payload.activeConfigIndex].data;
      }
      if (payload.constData) {
        Object.assign(constData.value, payload.constData);
      }
    }
  } catch (e) {
    console.error("jsInitData processing error:", e);
  }
};
onMounted(() => {
  console.log(1);
  Webview.register("jsInitData", jsInitData);
  Webview.register("onSaveResult", (success, message) => {
    if (success) {
      showSuccessToast(message || '本地配置方案保存成功！');
    } else {
      showFailToast(message || '本地配置方案保存失败！');
    }
  });
  Webview.register("showLogs", (logsTable) => {
    currentLogsData.value = logsTable || [];
  });

  if (window.bridge || window.webView) {
    Webview.callLua("initData", defaultData);
    Webview.callLua("getLogs");
  } else {
    jsInitData({
      configList: [{ name: '默认方案', data: { a: "aa", b: "bb" } }],
      activeConfigIndex: 0,
      constData: { a: "aa", b: "bb", loop: 2, account: 10 }
    });
  }
  timer = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--;
    } else {
      clearInterval(timer);
      showCountdownBtn.value = false;
      handleNext(); // 倒计时结束，静默保存 [cite: 46]
    }
  }, 1000);

  const mask = document.getElementById('loading-mask');
  if (mask) setTimeout(() => {
    mask.style.opacity = '0';
    setTimeout(() => mask.remove(), 200);
  }, 200);

  // 初始化缩放
  updateViewport(viewScale.value || 0.8);
});

// --- 8. 视觉设置与主题状态管理 ---
const theme = ref(localStorage.getItem("VISUAL_THEME") || "glass");
const viewScale = ref(Number(localStorage.getItem("VISUAL_VIEW_SCALE")) || 0.8);
const darkBgOpacity = ref(Number(localStorage.getItem("VISUAL_DARK_BG_OPACITY")) || 20);
const lightBgOpacity = ref(Number(localStorage.getItem("VISUAL_LIGHT_BG_OPACITY")) || 100);

const showThemePopup = ref(false);
const showSearchInput = ref(false);

const isGlass = computed(() => theme.value === "glass");

const opacity = computed({
  get: () => isGlass.value ? darkBgOpacity.value : lightBgOpacity.value,
  set: (val) => {
    if (isGlass.value) {
      darkBgOpacity.value = val;
      localStorage.setItem("VISUAL_DARK_BG_OPACITY", val);
      if (formData.value) formData.value.darkBgOpacity = val;
    } else {
      lightBgOpacity.value = val;
      localStorage.setItem("VISUAL_LIGHT_BG_OPACITY", val);
      if (formData.value) formData.value.lightBgOpacity = val;
    }
  }
});

const scalePercent = computed({
  get: () => Math.round(viewScale.value * 100),
  set: (val) => {
    const scale = Number((val / 100).toFixed(2));
    viewScale.value = scale;
    localStorage.setItem("VISUAL_VIEW_SCALE", scale);
    if (formData.value) formData.value.viewScale = scale;
  }
});

const updateViewport = (scale) => {
  const meta = document.querySelector('meta[name="viewport"]');
  if (meta) {
    meta.content = `width=device-width, initial-scale=${scale}, maximum-scale=${scale}, minimum-scale=${scale}, user-scalable=no`;
  }
};

watch(isGlass, (val) => {
  if (val) {
    document.documentElement.classList.add("theme-glass");
    document.body.classList.add("theme-glass");
  } else {
    document.documentElement.classList.remove("theme-glass");
    document.body.classList.remove("theme-glass");
  }
}, { immediate: true });

watch([opacity, isGlass], ([val]) => {
  const bgOpacity = val / 100;
  document.documentElement.style.setProperty("--bg-opacity", bgOpacity);
}, { immediate: true });

watch(theme, (val) => {
  localStorage.setItem("VISUAL_THEME", val);
  if (formData.value) formData.value.theme = val;
}, { immediate: true });

watch(viewScale, (val) => {
  updateViewport(val || 0.8);
}, { immediate: true });

// 监听 formData 变化，同步主题配置
watch(formData, (val) => {
  if (val && typeof val === 'object') {
    if (val.theme !== undefined) {
      theme.value = val.theme;
      localStorage.setItem("VISUAL_THEME", val.theme);
    }
    if (val.viewScale !== undefined) {
      viewScale.value = val.viewScale;
      localStorage.setItem("VISUAL_VIEW_SCALE", val.viewScale);
    }
    if (val.darkBgOpacity !== undefined) {
      darkBgOpacity.value = val.darkBgOpacity;
      localStorage.setItem("VISUAL_DARK_BG_OPACITY", val.darkBgOpacity);
    }
    if (val.lightBgOpacity !== undefined) {
      lightBgOpacity.value = val.lightBgOpacity;
      localStorage.setItem("VISUAL_LIGHT_BG_OPACITY", val.lightBgOpacity);
    }
    // 反向同步
    val.theme = theme.value;
    val.viewScale = viewScale.value;
    val.darkBgOpacity = darkBgOpacity.value;
    val.lightBgOpacity = lightBgOpacity.value;
  }
}, { immediate: true, deep: true });

onUnmounted(() => { if (timer) clearInterval(timer); });
</script>

<template>
  <div class="app-container" :class="{ 'theme-glass': isGlass }">
    <header class="fixed-header">
      <van-nav-bar fixed placeholder z-index="999" :class="{ 'navbar-searching': showSearchInput }">
        <template #left>
          <van-icon name="success" @click="handleSave(false)" size="22" />
        </template>
        <template #title>
          <transition name="search-slide" mode="out-in">
            <div v-if="showSearchInput" class="nav-search-wrapper">
              <van-search v-model="searchText" placeholder="输入关键字搜索..." />
            </div>
            <span v-else class="nav-title-text">{{ appTitle }}</span>
          </transition>
        </template>
        <template #right>
          <div style="display: flex; gap: 16px; align-items: center;">
            <van-icon
              :name="showSearchInput ? 'cross' : 'search'"
              @click="showSearchInput = !showSearchInput"
              size="22"
            />
            <van-icon
              name="brush-o"
              @click="showThemePopup = true"
              size="22"
            />
            <van-icon
              name="replay"
              @click="handleReload"
              size="22"
            />
          </div>
        </template>
      </van-nav-bar>
    </header>

    <van-cell center title="方案管理" class="config-bar">
      <template #value>
        <van-button size="small" type="primary" plain icon="apps-o" @click="showActionSheet = true">
          {{ configList[activeConfigIndex].name }}
        </van-button>
      </template>
    </van-cell>

    <van-tabs v-model:active="activeTab" sticky offset-top="46px" animated swipeable color="#1989fa">
      <van-tab v-for="(tab, idx) in filteredTabs" :key="tab.title"
        :name="settingGroups.findIndex(t => t.title === tab.title)">
        <template #title><van-icon :name="tab.icon" /> {{ tab.title }}</template>

        <div class="scroll-content">
          <Logs v-if="tab.component === 'Logs'" :log-data="currentLogsData" />
          <van-collapse v-model="activeNames" v-else>
            <!-- 此时 group 是 tab.groups 中的项 -->
            <template v-for="group in tab.groups" :key="group.name">
              <van-collapse-item :title="group.title" :name="group.name">
                <div v-for="(item, i) in group.items" :key="i">

                  <van-cell v-if="item.type === 'switch'" :title="item.label">
                    <template #right-icon><van-switch v-model="formData[item.key]" size="22px" /></template>
                  </van-cell>

                  <van-cell v-if="item.type === 'stepper'" :title="item.label">
                    <template #value><van-stepper v-model="formData[item.key]" :min="item.min" :max="item.max"
                        :step="item.step || 1" :input-width="item.width" /></template>
                  </van-cell>

                  <van-cell v-if="item.type === 'radio'" :title="item.label">
                    <template #right-icon>
                      <van-radio-group v-model="formData[item.key]" direction="horizontal">
                        <van-radio v-for="opt in item.options" :key="opt.value" :name="opt.value">{{ opt.text
                          }} </van-radio>
                      </van-radio-group>
                    </template>
                  </van-cell>
                  <van-cell v-if="item.type === 'checkbox'" :title="item.label"
                    :title-style="{ minWidth: item.label_width || '120px' }">
                    <template #right-icon><van-checkbox-group v-model="formData[item.key]" direction="horizontal">
                        <van-checkbox v-for="opt in item.options" :key="opt.value" :name="opt.value" shape="square"
                          :style="item.checkbox_width ? { minWidth: item.checkbox_width } : null">
                          {{ opt.text }}
                        </van-checkbox>
                      </van-checkbox-group>
                    </template>
                  </van-cell>
                  <van-field v-if="item.type === 'picker'" :model-value="getPickerText(item)" :label="item.label"
                    is-link readonly @click="onOpenPicker(item)" />

                  <van-field v-if="item.type === 'timeRange'" :label="item.label"
                    :model-value="formData[item.startKey] && formData[item.endKey] ? `${Array.isArray(formData[item.startKey]) ? formData[item.startKey].join(':') : formData[item.startKey]} - ${Array.isArray(formData[item.endKey]) ? formData[item.endKey].join(':') : formData[item.endKey]}` : ''" is-link
                    readonly @click="onOpenTimeRange(item)" />
                  <van-field v-if="item.type === 'input'" v-model="formData[item.key]" :label="item.label"
                    :placeholder="item.placeholder">
                    <template #button v-if="item.btnText">
                      <van-button size="small" type="primary" @click="handleButtonClick(item)"
                        style="min-width: 50px;">{{ item.btnText
                        }}</van-button>
                    </template>
                  </van-field>
                  <van-field v-if="item.type === 'textarea'" v-model="formData[item.key]" :label="item.label"
                    type="textarea" :rows="item.rows" autosize show-word-limit maxlength="500"
                    :placeholder="item.placeholder" />

                  <div v-if="item.type === 'textareaEx'" class="textarea-container">
                    <div class="textarea-title">{{ item.label }}</div>
                    <div class="custom-textarea-wrapper">
                      <div class="line-numbers">
                        <div v-for="n in (formData[item.key]?.split('\n').length || 1)" :key="n">{{ n }}</div>
                      </div>
                      <van-field v-model="formData[item.key]" type="textarea" :rows="item.rows" autosize
                        class="line-number-field" :placeholder="item.placeholder" />
                    </div>
                  </div>
                  <van-cell v-if="item.type === 'button'" :title="item.label">
                    <template #right-icon>
                      <van-button size="small" type="primary" @click="handleButtonClick(item)">{{ item.btnText
                        }} </van-button>
                    </template>
                  </van-cell>
                  <div v-if="item.type === 'desc'" class="van-cell hint" style="white-space: pre-line;">{{ item.desc
                  }}
                  </div>
                  <van-cell v-if="item.type === 'cell'" style="white-space: pre-line;" :icon="item.icon"
                    :title="parseText(item.title)" :value="item.value">
                  </van-cell>
                  <van-field v-if="item.type === 'transfer'" :label="item.label"
                    :model-value="getTransferText(item) || '请选择'" is-link readonly
                    @click="onOpenTransfer(item)" />

                </div>
              </van-collapse-item>
            </template>
          </van-collapse>
        </div>
      </van-tab>
    </van-tabs>

    <van-popup v-model:show="showLogsPopup" position="bottom" closeable>
      <Logs :log-data="currentLogsData" />
    </van-popup>



    <div class="footer-bar bui-box-space">
      <van-button type="danger" class="bui-span1" @click="handleExit">退出</van-button>

      <transition name="fade-scale">
        <van-button v-if="showCountdownBtn" type="success" class="bui-span2" @click="stopCountdown">
          停止倒计时 ({{ countdown }}s)
        </van-button>
      </transition>

      <van-button type="primary" class="bui-span1" @click="handleNext()">继续</van-button>
    </div>
    <van-action-sheet v-model:show="showActionSheet" title="方案管理">
      <div class="sheet-content">
        <div v-for="(conf, idx) in configList" :key="idx" class="config-row"
          :class="{ active: activeConfigIndex === idx }">
          <div class="name-info" @click="switchConfig(idx)">
            <van-icon :name="activeConfigIndex === idx ? 'success' : 'notes-o'" />
            <span>{{ conf.name }}</span>
          </div>
          <div class="actions">
            <van-icon name="description" @click.stop="copyConfig(idx)" />
            <van-icon name="edit" @click.stop="renameConfig(idx)" />
            <van-icon name="delete-o" color="#ee0a24" @click.stop="deleteConfig(idx)" />
          </div>
        </div>
        <van-button icon="plus" type="primary" block @click="addNewConfig" class="mt-20">新建方案</van-button>
      </div>
    </van-action-sheet>
    <van-popup v-model:show="showPicker" position="bottom" round>
      <van-picker :columns="currentPickerItem.options || []" @confirm="onConfirmPicker" @cancel="showPicker = false" />
    </van-popup>
    <van-popup v-model:show="showTimePicker" position="bottom" round>
      <van-picker-group title="选择时间段" :tabs="['开始时间', '结束时间']" next-step-text="下一步" @confirm="onConfirmTimePicker"
        @cancel="showTimePicker = false">
        <template v-if="currentTimeItem.startKey">
          <van-time-picker v-model="tempStartTime" title="开始时间" :formatter="timePicker_format"
            :min-hour="currentTimeItem.minHour" :max-hour="currentTimeItem.maxHour"
            :min-minute="currentTimeItem.minMinute" :max-minute="currentTimeItem.maxMinute" />
          <van-time-picker v-model="tempEndTime" title="结束时间" :formatter="timePicker_format"
            :min-hour="currentTimeItem.minHour" :max-hour="currentTimeItem.maxHour"
            :min-minute="currentTimeItem.minMinute" :max-minute="currentTimeItem.maxMinute" />
        </template>
      </van-picker-group>
    </van-popup>

    <!-- Transfer 穿梭框弹窗 -->
    <van-popup v-model:show="showTransferPopup" position="bottom" round>
      <div class="popup-content" style="max-height: 70vh; display: flex; flex-direction: column;">
        <van-nav-bar :title="currentTransferItem.label || '选择'" left-text="取消" right-text="确定"
          @click-left="showTransferPopup = false" @click-right="onConfirmTransfer" />
        <div style="flex: 1; overflow-y: auto;">
          <Transfer v-model="tempTransferValue"
            :options="Array.isArray(currentTransferItem.options) ? currentTransferItem.options : (formData[currentTransferItem.options] || [])" />
        </div>
      </div>
    </van-popup>

    <!-- 视觉设置面板 -->
    <van-popup
      v-model:show="showThemePopup"
      position="bottom"
      round
      safe-area-inset-bottom
      teleport="body"
    >
      <div class="visual-settings-panel">
        <div class="panel-header">视觉设置</div>
        
        <div class="setting-item">
          <div class="setting-label">皮肤</div>
          <van-radio-group v-model="theme" direction="horizontal">
            <van-radio name="light">经典</van-radio>
            <van-radio name="glass">毛玻璃</van-radio>
          </van-radio-group>
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <span>不透明度</span>
            <span class="setting-value">{{ opacity }}%</span>
          </div>
          <div class="slider-wrapper">
            <van-slider v-model="opacity" :min="0" :max="100" />
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <span>界面缩放</span>
            <span class="setting-value">{{ scalePercent }}%</span>
          </div>
          <div class="slider-wrapper">
            <van-slider v-model="scalePercent" :min="50" :max="150" />
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<style scoped>
.app-container {
  background: #f7f8fa;
  min-height: 100vh;
}

.fixed-header :deep(.van-nav-bar) {
  background: #1989fa;
}

.fixed-header :deep(.van-nav-bar__title),
.fixed-header :deep(.van-icon) {
  color: #fff;
}

.config-bar {
  margin: 4px 0;
  background: #fff;
}

.scroll-content {
  padding-bottom: 90px;
}

.footer-bar {
  position: fixed;
  bottom: 0;
  width: 100%;
  display: flex;
  padding: 10px;
  gap: 8px;
  background: #fff;
  box-sizing: border-box;
  z-index: 100;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.bui-span1 {
  flex: 1;
}

.bui-span2 {
  flex: 2;
}

.config-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px;
  margin-top: 10px;
  background: #f7f8fa;
  border-radius: 8px;
}

.config-row.active {
  background: #eef5fe;
  color: #1989fa;
  border: 1px solid #1989fa;
  box-sizing: border-box;
}

.name-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
}

.actions {
  display: flex;
  gap: 16px;
  font-size: 18px;
  color: #969799;
}

.textarea-container {
  padding: 10px 16px;
  background: #fff;
}

.custom-textarea-wrapper {
  display: flex;
  border: 1px solid #ebedf0;
  border-radius: 4px;
  overflow: hidden;
}

.line-numbers {
  padding: 10px 0;
  width: 32px;
  background: #f7f8fa;
  border-right: 1px solid #ebedf0;
  text-align: center;
  color: #969799;
  line-height: 24px;
  font-family: monospace;
}

:deep(.line-number-field .van-field__control) {
  line-height: 24px;
  font-family: monospace;
}

.mt-20 {
  margin-top: 20px;
}

/* 进入和离开的过程 */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 离开时的状态：透明度归零，且 flex 比例变为 0 */
.fade-scale-leave-to {
  opacity: 0;
  flex: 0;
  margin: 0;
  padding: 0;
  transform: scale(0.9);
  /* 轻微缩小效果 */
}

/* 进入前的初始状态 */
.fade-scale-enter-from {
  opacity: 0;
  flex: 0;
  transform: scale(0.9);
}

.van-radio-group,
.van-checkbox-group {
  display: flex;
  flex-wrap: wrap;
  /* 开启自动换行 */
  gap: 12px 0px;
  margin-top: 0;
  margin-bottom: 0;
}

:deep(.van-cell)::after {
  position: absolute;
  box-sizing: border-box;
  content: " ";
  pointer-events: none;
  top: auto;
  right: 16px;
  bottom: 0;
  left: 16px;
  border-bottom: 1px solid #ebedf0;
  transform: scaleY(0.5);
  z-index: 1;
  display: block;
}

.hint {
  color: #666;
  padding-left: 20px;
  margin-top: -10px !important;
  z-index: 2;
  /* 提高层级以遮挡上一个 cell 的 border (z-index: 1) */
  position: relative;
  background-color: #fff
}

:deep(.van-cell--borderless)::after {
  display: none;
}

:deep(.van-action-sheet__content) {
  padding: 0 16px 16px 16px;
}

:deep(.textarea-title) {
  color: var(--van-cell-text-color);
}

:deep(.van-field__label) {
  /*右边有按钮时保持文字垂直居中*/
  display: flex;
  align-items: center;
}

/* 视觉设置面板样式 */
.visual-settings-panel {
  padding: 20px 16px;
  background: #fff;
  border-radius: 20px 20px 0 0;
}
.theme-glass .visual-settings-panel {
  background: rgba(15, 23, 42, 0.95) !important;
  color: #f8fafc !important;
}
.visual-settings-panel .panel-header {
  font-size: 16px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 20px;
  color: #323233;
}
.theme-glass .visual-settings-panel .panel-header {
  color: #f8fafc !important;
}
.visual-settings-panel .setting-item {
  margin-bottom: 24px;
}
.visual-settings-panel .setting-label {
  font-size: 14px;
  color: #646566;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
}
.theme-glass .visual-settings-panel .setting-label {
  color: #94a3b8 !important;
}
.visual-settings-panel .setting-value {
  font-weight: 700;
  color: #1989fa;
}
.theme-glass .visual-settings-panel .setting-value {
  color: #818cf8 !important;
}
.visual-settings-panel .slider-wrapper {
  padding: 6px 4px;
}

/* 导航栏搜索过渡动画 */
.search-slide-enter-active,
.search-slide-leave-active {
  transition: all .12s cubic-bezier(.16, 1, .3, 1);
}
.search-slide-enter-from,
.search-slide-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

/* 导航栏搜索区域定制 */
.nav-search-wrapper {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.nav-search-wrapper :deep(.van-search) {
  padding: 0;
  background: transparent;
  width: 100%;
}
.nav-search-wrapper :deep(.van-search__content) {
  background: rgba(0, 0, 0, 0.06);
  border-radius: 6px;
}
.theme-glass .nav-search-wrapper :deep(.van-search__content) {
  background: rgba(15, 23, 42, 0.6) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
}
.nav-search-wrapper :deep(.van-field__control) {
  -webkit-text-fill-color: var(--van-field-input-text-color, #323233) !important;
  color: var(--van-field-input-text-color, #323233) !important;
}
.theme-glass .nav-search-wrapper :deep(.van-field__control) {
  -webkit-text-fill-color: #f8fafc !important;
  color: #f8fafc !important;
}
.nav-title-text {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
}
.theme-glass .nav-title-text {
  background: linear-gradient(90deg, #818cf8, #c084fc) !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
}
:deep(.van-nav-bar__title) {
  max-width: 65% !important;
  width: 65%;
  transition: all 0.15s ease;
}
.navbar-searching :deep(.van-nav-bar__title) {
  position: absolute !important;
  left: 48px !important;
  right: 120px !important;
  margin: 0 !important;
  max-width: none !important;
  width: auto !important;
}
.nav-search-wrapper :deep(.van-field__control::placeholder) {
  color: rgba(100, 101, 102, 0.6) !important;
  -webkit-text-fill-color: rgba(100, 101, 102, 0.6) !important;
}
.theme-glass .nav-search-wrapper :deep(.van-field__control::placeholder) {
  color: rgba(255, 255, 255, 0.45) !important;
  -webkit-text-fill-color: rgba(255, 255, 255, 0.45) !important;
}
.theme-glass .nav-search-wrapper :deep(.van-field__left-icon) .van-icon {
  color: rgba(255, 255, 255, 0.6) !important;
}
</style>