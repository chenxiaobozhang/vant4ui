<script setup>
import { ref, toRaw, reactive, onMounted, onUnmounted, watch, computed, h } from 'vue';
import { showDialog, Field } from 'vant';
import { callLuaFun } from './public.js';

// --- 1. 鍩虹閰嶇疆涓庨粯璁ゆ暟鎹?---
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
  countdownTime: 30
};

const appTitle = window.UI_DATA?.appTitle || "铦磋澏 2.44";



// 杈呭姪鍑芥暟锛氭繁搴﹀厠闅?[cite: 7, 13]
const createNewData = () => JSON.parse(JSON.stringify(defaultData));

// --- 2. 澶氶厤缃鐞嗛€昏緫 ---
const showActionSheet = ref(false);

const getInitialList = () => {
  const local = localStorage.getItem(STORAGE_LIST_KEY);
  if (local) {
    try {
      const list = JSON.parse(local);
      // 纭繚鏂板鍔犵殑閰嶇疆瀛楁锛堝 countdownTime锛夎兘澶熷悎骞跺埌鏃ф暟鎹腑
      const def = createNewData();
      list.forEach(item => {
        // 浣跨敤 Object.assign 鎴栬€呰В鏋勮祴鍊兼潵纭繚榛樿鍊煎瓨鍦?        // 娉ㄦ剰锛氳繖閲岀畝鍗曞悎骞讹紝濡傛灉鐢ㄦ埛鍒犻櫎浜嗘煇浜涘瓧娈靛彲鑳借閲嶇疆锛屼絾瀵逛簬鏂板瀛楁鏄繀瑕佺殑
        item.data = { ...def, ...item.data };
      });
      return list;
    } catch (e) { console.error(e); }
  }
  return [{ name: '榛樿鏂规', data: createNewData() }];
};

const configList = reactive(getInitialList());
const activeConfigIndex = ref(Number(localStorage.getItem(STORAGE_INDEX_KEY)) || 0);

// formData 鍔ㄦ€佹寚鍚戝綋鍓嶉€変腑鐨勯厤缃?[cite: 8]
const formData = computed(() => configList[activeConfigIndex.value]?.data || {});

const saveAllToLocal = () => {
  localStorage.setItem(STORAGE_LIST_KEY, JSON.stringify(toRaw(configList)));
  localStorage.setItem(STORAGE_INDEX_KEY, activeConfigIndex.value);
};

// --- 3. 鏂规鎿嶄綔鍑芥暟 (淇 Promise Cancel 鎶ラ敊) ---
const switchConfig = (index) => {
  activeConfigIndex.value = index;
  saveAllToLocal();
  showActionSheet.value = false;
};

const addNewConfig = () => {
  if (configList.length >= (window.UI_DATA?.configsLimit || 20)) {
    return showDialog({ message: '鏂规鏁伴噺宸茶揪涓婇檺' });
  }
  let newName = `鏂规 ${configList.length + 1}`;
  showDialog({
    title: '鏂板缓鏂规',
    showCancelButton: true,
    message: () => h('div', { style: 'padding: 20px;' }, [
      h(Field, {
        modelValue: newName,
        'onUpdate:modelValue': (val) => (newName = val),
        placeholder: '璇疯緭鍏ユ柟妗堝悕绉?,
        border: true,
        autofocus: true
      })
    ]),
  }).then((action) => {
    if (action === 'confirm') {
      configList.push({
        name: newName.trim() || '鏈懡鍚嶆柟妗?,
        data: createNewData()
      });
      activeConfigIndex.value = configList.length - 1;
      saveAllToLocal();
    }
  }).catch(() => { }); // 鎹曡幏鍙栨秷鎿嶄綔锛岄槻姝㈡帶鍒跺彴鎶ラ敊 [cite: 12, 13]
};

const renameConfig = (index) => {
  let currentName = configList[index].name;
  showDialog({
    title: '閲嶅懡鍚?,
    showCancelButton: true,
    message: () => h('div', { style: 'padding: 20px;' }, [
      h(Field, {
        modelValue: currentName,
        'onUpdate:modelValue': (val) => (currentName = val),
        placeholder: '璇疯緭鍏ユ柊鍚嶇О',
        border: true,
        autofocus: true
      })
    ]),
  }).then((action) => {
    if (action === 'confirm' && currentName.trim()) {
      configList[index].name = currentName.trim();
      saveAllToLocal();
    }
  }).catch(() => { }); // 鎹曡幏鍙栨秷鎿嶄綔 [cite: 15, 16]
};

const deleteConfig = (index) => {
  if (configList.length <= 1) return showDialog({ message: '鑷冲皯淇濈暀涓€涓柟妗? });
  showDialog({
    title: '纭鍒犻櫎',
    message: `纭畾瑕佸垹闄?[${configList[index].name}] 鍚楋紵`,
    showCancelButton: true
  }).then((action) => {
    if (action === 'confirm') {
      configList.splice(index, 1);
      if (activeConfigIndex.value >= configList.length) activeConfigIndex.value = 0;
      saveAllToLocal();
    }
  }).catch(() => { }); // 鎹曡幏鍙栨秷鎿嶄綔 [cite: 18]
};

// --- 4. 閫夋嫨鍣ㄩ€昏緫 ---
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

// --- 5. 鏃堕棿閫夋嫨鍣ㄩ€昏緫 ---
const timePicker_format = (type, option) => {
  if (type === 'hour') option.text += '鏃?;
  if (type === 'minute') option.text += '鍒?;
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
    return showDialog({ message: '缁撴潫鏃堕棿蹇呴』鏅氫簬寮€濮嬫椂闂? }).catch(() => { });
  }
  formData.value[item.startKey] = [...tempStartTime.value];
  formData.value[item.endKey] = [...tempEndTime.value];
  showTimePicker.value = false;
};

// --- 6. UI 閰嶇疆鏁版嵁 ---
const activeTab = ref(window.UI_DATA?.activeTab || 0);
// const tabsConfig 绉婚櫎锛岀洿鎺ヤ娇鐢?settingGroups 涓殑缁撴瀯

const settingGroups = window.UI_DATA?.settingGroups || [];

const activeNames = ref(['1', '3', '4', '5']);
const searchText = ref('');

// 璁＄畻灞炴€э細杩囨护鍚庣殑 Tabs 缁撴瀯
const filteredTabs = computed(() => {
  const keyword = searchText.value.trim().toLowerCase();
  if (!keyword) return settingGroups;

  return settingGroups.map(tab => {
    // 杩囨护 Tab 涓嬬殑 Groups
    const matchedGroups = tab.groups.map(group => {
      const isGroupTitleMatch = group.title.toLowerCase().includes(keyword);
      // 杩囨护 Group 涓嬬殑 Items
      const matchedItems = group.items.filter(item => item.label?.toLowerCase().includes(keyword));

      if (isGroupTitleMatch) return { ...group }; // Group 鏍囬鍖归厤锛屾樉绀烘暣涓?Group
      if (matchedItems.length > 0) return { ...group, items: matchedItems }; // Items 鍖归厤锛屾樉绀哄尮閰嶇殑 Items
      return null;
    }).filter(Boolean);

    // 濡傛灉 Tab 涓嬫湁鍖归厤鐨?Group锛屽垯杩斿洖璇?Tab
    if (matchedGroups.length > 0) {
      return { ...tab, groups: matchedGroups };
    }
    return null;
  }).filter(Boolean);
});

// 鐩戝惉鎼滅储锛岃嚜鍔ㄨ烦杞埌绗竴涓尮閰嶉」
watch(searchText, (val) => {
  if (!val.trim() || filteredTabs.value.length === 0) return;

  // 灞曞紑鎵€鏈夊尮閰嶇殑 Groups
  const allGroupNames = filteredTabs.value.flatMap(tab => tab.groups.map(g => g.name));
  activeNames.value = [...new Set([...activeNames.value, ...allGroupNames])];

  // 鍒囨崲鍒扮涓€涓湁缁撴灉鐨?Tab
  // 鍘熷 settingGroups 瀵瑰簲鐨勭储寮?  const firstMatchedTabTitle = filteredTabs.value[0].title;
  const originalIndex = settingGroups.findIndex(tab => tab.title === firstMatchedTabTitle);
  if (originalIndex !== -1) activeTab.value = originalIndex;
});


// --- 7. 鍊掕鏃朵笌闈欓粯淇濆瓨閫昏緫 ---
// 鍒濆鍖栧€掕鏃讹細浼樺厛浣跨敤 formData 涓殑閰嶇疆锛屽惁鍒欓粯璁?30
const getInitialCountdown = () => {
  // formData 鏄?computed锛屾鏃跺彲鑳借繕鏈噯澶囧ソ锛屾垨鑰呭凡缁忓噯澶囧ソ銆?  // 浣嗗湪 setup 闃舵 configList 鍙婂叾 activeConfigIndex 宸茬粡鏈夊€笺€?  // 鎴戜滑鐩存帴璇诲彇 configList 涓綋鍓嶆柟妗堢殑鏁版嵁銆?  const currentData = configList[activeConfigIndex.value]?.data;
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
    showDialog({ message: `閰嶇疆 [${configList[activeConfigIndex.value].name}] 宸蹭繚瀛榒 }).catch(() => { });
  }
};

onMounted(() => {
  timer = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--;
    } else {
      clearInterval(timer);
      showCountdownBtn.value = false;
      handleSave(true); // 鍊掕鏃剁粨鏉燂紝闈欓粯淇濆瓨 [cite: 46]
    }
  }, 1000);

  const mask = document.getElementById('loading-mask');
  if (mask) setTimeout(() => { mask.style.opacity = '0'; setTimeout(() => mask.remove(), 200); }, 200);
});

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

    <van-cell center title="鏂规绠＄悊" class="config-bar">
      <template #value>
        <van-button size="small" type="primary" plain icon="apps-o" @click="showActionSheet = true">
          {{ configList[activeConfigIndex].name }}
        </van-button>
      </template>
    </van-cell>

    <van-sticky :offset-top="46">
      <van-search v-model="searchText" placeholder="杈撳叆鎯宠鎼滅储鐨勫姛鑳?.." />
    </van-sticky>

    <van-tabs v-model:active="activeTab" sticky offset-top="100px" animated swipeable color="#1989fa">
      <van-tab v-for="(tab, idx) in filteredTabs" :key="idx">
        <template #title><van-icon :name="tab.icon" /> {{ tab.title }}</template>

        <div class="scroll-content">
          <van-collapse v-model="activeNames">
            <!-- 姝ゆ椂 group 鏄?tab.groups 涓殑椤?-->
            <template v-for="group in tab.groups" :key="group.name">
              <van-collapse-item :title="group.title" :name="group.name">
                <div v-for="(item, i) in group.items" :key="i">

                  <van-cell v-if="item.type === 'switch'" :title="item.label">
                    <template #right-icon><van-switch v-model="formData[item.key]" size="22px" /></template>
                  </van-cell>

                  <van-cell v-if="item.type === 'stepper'" :title="item.label">
                    <template #value><van-stepper v-model="formData[item.key]" :min="item.min" :max="item.max"
                        :input-width="item.width" /></template>
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
        @click="showDialog({ message: '宸查€€鍑? }).catch(() => { })">閫€鍑?/van-button>

      <transition name="fade-scale">
        <van-button v-if="showCountdownBtn" type="success" class="bui-span2" @click="showCountdownBtn = false">
          鍋滄鍊掕鏃?({{ countdown }}s)
        </van-button>
      </transition>

      <van-button type="primary" class="bui-span1" @click="handleSave(false)">淇濆瓨閰嶇疆</van-button>
    </div>
    <van-action-sheet v-model:show="showActionSheet" title="鏂规绠＄悊">
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
        <van-button icon="plus" type="primary" block @click="addNewConfig" class="mt-20">鏂板缓鏂规</van-button>
      </div>
    </van-action-sheet>
    <van-popup v-model:show="showPicker" position="bottom" round>
      <van-picker :columns="currentPickerItem.options || []" @confirm="onConfirmPicker" @cancel="showPicker = false" />
    </van-popup>
    <van-popup v-model:show="showTimePicker" position="bottom" round>
      <van-picker-group title="閫夋嫨鏃堕棿娈? :tabs="['寮€濮嬫椂闂?, '缁撴潫鏃堕棿']" next-step-text="涓嬩竴姝? @confirm="onConfirmTimePicker"
        @cancel="showTimePicker = false">
        <template v-if="currentTimeItem.startKey">
          <van-time-picker v-model="tempStartTime" title="寮€濮嬫椂闂? :formatter="timePicker_format"
            :min-hour="currentTimeItem.minHour" :max-hour="currentTimeItem.maxHour"
            :min-minute="currentTimeItem.minMinute" :max-minute="currentTimeItem.maxMinute" />
          <van-time-picker v-model="tempEndTime" title="缁撴潫鏃堕棿" :formatter="timePicker_format"
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

/* 杩涘叆鍜岀寮€鐨勮繃绋?*/
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 绂诲紑鏃剁殑鐘舵€侊細閫忔槑搴﹀綊闆讹紝涓?flex 姣斾緥鍙樹负 0 */
.fade-scale-leave-to {
  opacity: 0;
  flex: 0;
  margin: 0;
  padding: 0;
  transform: scale(0.9);
  /* 杞诲井缂╁皬鏁堟灉 */
}

/* 杩涘叆鍓嶇殑鍒濆鐘舵€?*/
.fade-scale-enter-from {
  opacity: 0;
  flex: 0;
  transform: scale(0.9);
}

.van-radio-group,
.van-checkbox-group {
  display: flex;
  flex-wrap: wrap;
  /* 寮€鍚嚜鍔ㄦ崲琛?*/
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
  /* 鎻愰珮灞傜骇浠ラ伄鎸′笂涓€涓?cell 鐨?border (z-index: 1) */
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
