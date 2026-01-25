<script setup>
import { ref, toRaw, reactive, onMounted, onUnmounted, watch, computed, h } from 'vue';
import { showDialog, Field } from 'vant';
import { callLuaFun } from './public.js';

// --- 1. 基础配置与默认数据 ---
const STORAGE_LIST_KEY = 'UI_CONFIG_LIST';
const STORAGE_INDEX_KEY = 'UI_CONFIG_ACTIVE_INDEX';

const defaultData = window.UI_DATA?.defaultData || {
  autoPromote: false,
  autoHarvest: true,
  autoDate: false,
  autoAffairs: true,
  itemCount: 5,
  dungeonDifficulty: '2',
  lmfb: [1, 2],
  tasks: ['a'],
  server: '',
  jc_startTime: ['08', '00'],
  jc_endTime: ['10', '00'],
  jc_startTime1: ['08', '00'],
  jc_endTime1: ['10', '00'],
  remarks: "",
  scriptContent: "aa",
  countdownTime: 30,
  viewScale: 1.0
};

const appTitle = window.UI_DATA?.appTitle || "蝴蝶 2.44";



// 辅助函数：深度克隆 [cite: 7, 13]
const createNewData = () => JSON.parse(JSON.stringify(defaultData));

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
};

// --- 3. 方案操作函数 (修复 Promise Cancel 报错) ---
const switchConfig = (index) => {
  activeConfigIndex.value = index;
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
  tempStartTime.value = [...formData.value[item.startKey]];
  tempEndTime.value = [...formData.value[item.endKey]];
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
const handleSave = (isSilent = false) => {
  saveAllToLocal();
  console.log(toRaw(formData.value));
  callLuaFun("luaFun", toRaw(formData.value));
  if (!isSilent) {
    showDialog({ message: `配置 [${configList[activeConfigIndex.value].name}] 已保存` }).catch(() => { });
  }
};

onMounted(() => {
  timer = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--;
    } else {
      clearInterval(timer);
      showCountdownBtn.value = false;
      handleSave(true); // 倒计时结束，静默保存 [cite: 46]
    }
  }, 1000);

  const mask = document.getElementById('loading-mask');
  if (mask) setTimeout(() => {
    mask.style.opacity = '0';
    setTimeout(() => mask.remove(), 200);
    window.dispatchEvent(new Event('resize'));
  }, 200);

  // 初始化缩放
  updateViewport(formData.value.viewScale || 1.0);
});

// 监听缩放变化
watch(() => formData.value.viewScale, (val) => {
  updateViewport(val || 1.0);
});

const updateViewport = (scale) => {
  const meta = document.querySelector('meta[name="viewport"]');
  if (meta) {
    meta.content = `width=device-width, initial-scale=${scale}, maximum-scale=${scale}, minimum-scale=${scale}, user-scalable=no`;
  }
};

onUnmounted(() => { if (timer) clearInterval(timer); });
</script>

<template>
  <div class="app-container">
    <header class="fixed-header">
      <van-nav-bar :title="appTitle" fixed placeholder z-index="999">

        <template #left><van-icon name="success" @click="handleSave(false)" size="18" /></template>
        <template #right><van-icon name="replay" @click="handleReload" size="18" /></template>
      </van-nav-bar>
    </header>

    <van-cell center title="方案管理" class="config-bar">
      <template #value>
        <van-button size="small" type="primary" plain icon="apps-o" @click="showActionSheet = true">
          {{ configList[activeConfigIndex].name }}
        </van-button>
      </template>
    </van-cell>

    <van-sticky :offset-top="46">
      <van-search v-model="searchText" placeholder="输入想要搜索的功能..." />
    </van-sticky>

    <van-tabs v-model:active="activeTab" sticky offset-top="100px" animated swipeable color="#1989fa">
      <van-tab v-for="(tab, idx) in filteredTabs" :key="tab.title"
        :name="settingGroups.findIndex(t => t.title === tab.title)">
        <template #title><van-icon :name="tab.icon" /> {{ tab.title }}</template>

        <div class="scroll-content">
          <van-collapse v-model="activeNames">
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
                        }}</van-radio>
                      </van-radio-group>
                    </template>
                  </van-cell>
                  <van-cell v-if="item.type === 'checkbox'" :title="item.label"
                    :title-style="{ minWidth: item.label_minWidth || '120px' }">
                    <template #right-icon><van-checkbox-group v-model="formData[item.key]" direction="horizontal">
                        <van-checkbox v-for="opt in item.options" :key="opt.value" :name="opt.value" shape="square">
                          {{ opt.text }}
                        </van-checkbox>
                      </van-checkbox-group>
                    </template>
                  </van-cell>
                  <van-field v-if="item.type === 'picker'" :model-value="getPickerText(item)" :label="item.label"
                    is-link readonly @click="onOpenPicker(item)" />

                  <van-field v-if="item.type === 'timeRange'" :label="item.label"
                    :model-value="`${formData[item.startKey].join(':')} - ${formData[item.endKey].join(':')}`" is-link
                    readonly @click="onOpenTimeRange(item)" />
                  <van-field v-if="item.type === 'input'" v-model="formData[item.key]" :label="item.label"
                    :placeholder="item.placeholder" />
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
                  <div v-if="item.type === 'desc'" class="van-cell hint" style="white-space: pre-line;">{{ item.desc
                    }}
                  </div>
                </div>
              </van-collapse-item>
            </template>
          </van-collapse>
        </div>
      </van-tab>
    </van-tabs>



    <div class="footer-bar bui-box-space">
      <van-button type="danger" class="bui-span1"
        @click="showDialog({ message: '已退出' }).catch(() => { })">退出</van-button>

      <transition name="fade-scale">
        <van-button v-if="showCountdownBtn" type="success" class="bui-span2" @click="showCountdownBtn = false">
          停止倒计时 ({{ countdown }}s)
        </van-button>
      </transition>

      <van-button type="primary" class="bui-span1" @click="handleSave(false)">保存配置</van-button>
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
</style>