<template>
  <div :style="isEditMode ? { pointerEvents: 'none' } : null" :class="['form-field-wrapper', { 'form-field-simple': simple }]">
    <!-- 简易/原生渲染模式：只渲染核心控件，不带外层 Cell/Field 包装，适用于 Group 嵌套和编辑器拖拽状态 -->
    <template v-if="simple">
      <!-- Button 按钮 -->
      <van-button
        v-if="item.type === 'button'"
        size="small"
        type="primary"
        @click="$emit('button-click', item)"
        :style="{ width: item.btnWidth || null, flex: item.btnWidth ? 'none' : 'auto' }"
      >
        {{ item.btnText || '按钮' }}
      </van-button>

      <!-- Stepper 步进器 -->
      <van-stepper
        v-else-if="item.type === 'stepper'"
        v-model="formData[item.key]"
        :min="item.min !== undefined ? item.min : 0"
        :max="item.max"
        :step="item.step || 1"
        :input-width="item.width"
      />

      <!-- Checkbox 复选框 -->
      <van-checkbox
        v-else-if="item.type === 'checkbox'"
        v-model="formData[item.key]"
        shape="square"
      >
        {{ item.text }}
      </van-checkbox>

      <!-- Radio 单选框 -->
      <van-radio
        v-else-if="item.type === 'radio'"
        v-model="formData[item.key]"
        :name="item.value"
      >
        {{ item.text }}
      </van-radio>

      <!-- Input 简单输入框 -->
      <input
        v-else-if="item.type === 'input'"
        v-model="formData[item.key]"
        class="van-input-bg"
        :placeholder="item.placeholder"
        :style="{
          textAlign: item.textAlign || 'center',
          width: item.width || ((String(formData[item.key] || '').length + 1) + 'em'),
          flex: item.width ? 'none' : '0 1 auto'
        }"
      />

      <!-- Text/Span 纯文本/描述 -->
      <span v-else-if="item.type === 'text'" :style="item.style">{{ item.text }}</span>

      <!-- Switch 开关 -->
      <van-switch
        v-else-if="item.type === 'switch'"
        v-model="formData[item.key]"
        size="22px"
      />
    </template>

    <!-- 完整渲染模式：自带 Vant Cell/Field 包装，适用于正常行渲染 -->
    <template v-else>
      <!-- 1. Switch 开关 -->
      <van-cell v-if="item.type === 'switch'" center :title="parseText(item.label)">
        <template #right-icon>
          <van-switch v-model="formData[item.key]" size="22px" />
        </template>
      </van-cell>

      <!-- 2. Stepper 步进器 -->
      <van-cell v-else-if="item.type === 'stepper'" :title="parseText(item.label)">
        <template #value>
          <van-stepper
            v-model="formData[item.key]"
            :min="item.min !== undefined ? item.min : 0"
            :max="item.max"
            :step="item.step || 1"
            :input-width="item.width"
          />
        </template>
      </van-cell>

      <!-- 3. Radio 单选框 -->
      <van-cell
        v-else-if="item.type === 'radio'"
        center
        :title="parseText(item.label) || null"
        :style="{ fontSize: item.fontSize ? item.fontSize : null }"
        title-class="van-field__label"
        :title-style="{ minWidth: item.label_width || '120px', display: item.label ? 'block' : 'none' }"
      >
        <van-radio-group
          v-model="formData[item.key]"
          direction="horizontal"
          :style="{ justifyContent: item.justify || 'flex-start' }"
        >
          <van-radio
            v-for="(opt, idx) in (item.options || [])"
            :key="idx"
            :name="opt.value"
            :style="item.checkbox_width || item.radio_width ? { minWidth: item.checkbox_width || item.radio_width } : null"
          >
            {{ opt.text }}
          </van-radio>
        </van-radio-group>
      </van-cell>

      <!-- 4. Checkbox 复选框 -->
      <van-cell
        v-else-if="item.type === 'checkbox'"
        center
        :title="parseText(item.label) || null"
        :style="{ fontSize: item.fontSize ? item.fontSize : null }"
        title-class="van-field__label"
        :title-style="{ minWidth: item.label_width || '120px', display: item.label ? 'block' : 'none' }"
      >
        <van-checkbox-group
          v-model="formData[item.key]"
          direction="horizontal"
          :style="{ justifyContent: item.justify || 'flex-start' }"
        >
          <van-checkbox
            v-for="(opt, idx) in (item.options || [])"
            :key="idx"
            :name="opt.value"
            shape="square"
            :style="item.checkbox_width ? { minWidth: item.checkbox_width } : null"
            :indeterminate="getIndeterminate(opt)"
            @click="onCheckboxClick(opt)"
          >
            {{ opt.text }}
          </van-checkbox>
        </van-checkbox-group>
      </van-cell>

      <!-- 5. Picker 选择器 -->
      <van-field
        v-else-if="item.type === 'picker'"
        :model-value="getPickerText(item)"
        :label="parseText(item.label)"
        is-link
        readonly
        @click="$emit('open-picker', item)"
      />

      <!-- 6. TimeRange 时间段 -->
      <van-cell
        v-else-if="item.type === 'timeRange'"
        :title="parseText(item.label)"
        is-link
        @click="$emit('open-time-range', item)"
      >
        <template #value>
          <span v-if="formData[item.startKey] && formData[item.endKey]">
            {{ Array.isArray(formData[item.startKey]) ? formData[item.startKey].join(':') : formData[item.startKey] }} -
            {{ Array.isArray(formData[item.endKey]) ? formData[item.endKey].join(':') : formData[item.endKey] }}
          </span>
          <span v-else-if="formData[item.key] && Array.isArray(formData[item.key]) && formData[item.key].length >= 4">
            {{ formData[item.key][0] }}:{{ formData[item.key][1] }} - {{ formData[item.key][2] }}:{{ formData[item.key][3] }}
          </span>
          <span v-else>请选择</span>
        </template>
      </van-cell>

      <!-- 7. Input 输入框 -->
      <van-field v-else-if="item.type === 'input'" :label="parseText(item.label)">
        <template #input>
          <input
            v-model="formData[item.key]"
            :style="{ width: item.width || null }"
            :placeholder="item.placeholder"
            :input-align="item.textAlign || null"
            :class="item.showbg ? 'van-input-bg' : 'van-field__control'"
          />
        </template>
        <template #button v-if="item.btnText">
          <van-button
            size="small"
            type="primary"
            @click="$emit('button-click', item)"
            :style="{ width: item.btnWidth || null }"
          >
            {{ item.btnText }}
          </van-button>
        </template>
      </van-field>

      <!-- 8. Button 按钮 -->
      <van-cell v-else-if="item.type === 'button'" :title="parseText(item.label)">
        <template #right-icon>
          <van-button
            size="small"
            type="primary"
            @click="$emit('button-click', item)"
            :style="{ width: item.btnWidth || null }"
          >
            {{ item.btnText || '执行' }}
          </van-button>
        </template>
      </van-cell>

      <!-- 9. Textarea 文本域 -->
      <van-field
        v-else-if="item.type === 'textarea'"
        v-model="formData[item.key]"
        :label="parseText(item.label)"
        type="textarea"
        :rows="item.rows || 2"
        autosize
        show-word-limit
        maxlength="500"
        :placeholder="item.placeholder"
      />

      <!-- 10. TextareaEx 增强文本域 -->
      <div v-else-if="item.type === 'textareaEx'" class="textarea-container">
        <div class="textarea-title">{{ parseText(item.label) }}</div>
        <div class="custom-textarea-wrapper">
          <div class="line-numbers">
            <div v-for="n in (formData[item.key]?.split('\n').length || 1)" :key="n">{{ n }}</div>
          </div>
          <van-field
            v-model="formData[item.key]"
            type="textarea"
            :rows="item.rows"
            autosize
            class="line-number-field"
            :placeholder="item.placeholder"
          />
        </div>
      </div>

      <!-- 11. Desc 说明文本 -->
      <div v-else-if="item.type === 'desc'" class="van-cell hint" style="white-space: pre-line;">
        <span :style="item.style">{{ parseText(item.desc) }}</span>
      </div>

      <!-- 12. Cell 展示单元格 -->
      <van-cell
        v-else-if="item.type === 'cell'"
        :icon="item.icon"
        :title="parseText(item.label)"
        :value-class="item.justify == 'start' ? 'text-left' : null"
        title-class="van-field__label"
      >
        <template #value>
          <span :style="item.style">{{ parseText(item.value) }}</span>
        </template>
      </van-cell>

      <!-- 13. Transfer 穿梭框 -->
      <van-field
        v-else-if="item.type === 'transfer'"
        :label="parseText(item.label)"
        :model-value="getTransferText(item) || '请选择'"
        is-link
        readonly
        placeholder="请选择"
        @click="$emit('open-transfer', item)"
      />

      <!-- 14. Group 分组容器 (标准标签模式) -->
      <van-field
        v-if="item.type === 'group' && item.showLabel !== false"
        :label="parseText(item.label)"
      >
        <template #input>
          <div
            :style="{
              display: 'flex',
              gap: '8px',
              width: '100%',
              alignItems: 'center',
              flexWrap: 'wrap',
              justifyContent: item.justify || 'flex-start'
            }"
          >
            <!-- 渲染嵌套的子项，子项强制使用 simple 简易渲染模式 -->
            <template v-for="(sub, subIdx) in item.children" :key="subIdx">
              <FormField
                :item="sub"
                :form-data="formData"
                :const-data="constData"
                :simple="true"
                :is-edit-mode="isEditMode"
                :style="item.layout === 'grid' ? { width: `calc(${ (sub.span || 12) / 24 * 100 }% - ${ 8 * (1 - (sub.span || 12) / 24) }px)` } : null"
                @button-click="(btnItem) => $emit('button-click', btnItem)"
              />
            </template>
          </div>
        </template>
      </van-field>

      <!-- 14. Group 分组容器 (通栏卡片模式) -->
      <div
        v-else-if="item.type === 'group' && item.showLabel === false"
        class="van-cell group-full-cell"
      >
        <div
          :style="{
            display: 'flex',
            gap: '8px',
            width: '100%',
            alignItems: 'center',
            flexWrap: 'wrap',
            justifyContent: item.justify || 'flex-start'
          }"
        >
          <!-- 渲染嵌套的子项，子项强制使用 simple 简易渲染模式 -->
          <template v-for="(sub, subIdx) in item.children" :key="subIdx">
            <FormField
              :item="sub"
              :form-data="formData"
              :const-data="constData"
              :simple="true"
              :is-edit-mode="isEditMode"
              :style="item.layout === 'grid' ? { width: `calc(${ (sub.span || 12) / 24 * 100 }% - ${ 8 * (1 - (sub.span || 12) / 24) }px)` } : null"
              @button-click="(btnItem) => $emit('button-click', btnItem)"
            />
          </template>
        </div>
      </div>

      <!-- 15. Text 纯文本 -->
      <div v-else-if="item.type === 'text'" class="van-cell" :style="item.style">
        {{ item.text }}
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  formData: {
    type: Object,
    required: true
  },
  constData: {
    type: Object,
    default: () => ({})
  },
  isEditMode: {
    type: Boolean,
    default: false
  },
  simple: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits([
  'checkbox-click',
  'button-click',
  'open-picker',
  'open-time-range',
  'open-transfer'
]);

// 纯文本解析函数，支持模板内的变量插值
const parseText = (text) => {
  if (text === false || text === '') return undefined;
  if (!text || typeof text !== 'string' || !text.includes('${')) return text;
  return text.replace(/\$\{([\w\.]+)\}/g, (_, key) => {
    const val = key.split('.').reduce((o, k) => (o || {})[k], props.constData);
    return val !== undefined ? val : '';
  });
};

// Checkbox 半选状态判定
const getIndeterminate = (opt) => {
  if (!props.item.indeterminate) return false;
  const indKey = props.item.key + '_indeterminate';
  if (!props.formData) return false;
  const list = props.formData[indKey];
  return Array.isArray(list) && list.includes(opt.value);
};

// Checkbox 点击回调，触发事件到父级
const onCheckboxClick = (opt) => {
  emit('checkbox-click', { item: props.item, opt });
};

// 获取 Picker 显示文本
const getPickerText = (item) => {
  const val = props.formData[item.key];
  const option = item.options?.find(opt => opt.value === val);
  return option ? option.text : val;
};

// 获取 Transfer 显示文本
const getTransferText = (item) => {
  const selectedIds = props.formData[item.key] || [];
  if (selectedIds.length === 0) return '';

  const options = Array.isArray(item.options) ? item.options : (props.formData[item.options] || []);
  const fieldNames = item.fieldNames || { text: 'text', value: 'value' };

  if (selectedIds.length > 3) {
    return `已选择 ${selectedIds.length} 项`;
  }

  return selectedIds.map(id => {
    const opt = options.find(o =>
      o[fieldNames.value] === id || o.value === id || o.id === id
    );
    if (!opt) return id;
    return opt[fieldNames.text] || opt.text || opt.name || id;
  }).join(', ');
};
</script>

<style scoped>
.form-field-wrapper {
  width: 100%;
}
.form-field-simple {
  width: auto;
  display: inline-flex;
  align-items: center;
}
:deep(.van-checkbox), :deep(.van-radio) {
  margin-bottom: 8px;
}
:deep(.van-checkbox-group), :deep(.van-radio-group) {
  margin-bottom: -8px;
}

/* 10. TextareaEx 增强带行号输入框样式 */
.textarea-container {
  padding: 10px 16px;
  background: #fff;
  text-align: left;
}
.textarea-title {
  color: var(--van-cell-text-color);
  font-size: 14px;
  margin-bottom: 8px;
  text-align: left;
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
  box-sizing: border-box;
}
:deep(.line-number-field .van-field__control) {
  line-height: 24px;
  font-family: monospace;
}
</style>
