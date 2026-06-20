<template>
  <div class="draggable-transfer">
    <div class="transfer-header">
      <span class="title">已选择 (按顺序排列)</span>
      <span class="count">{{ modelValue.length }}/{{ options.length }}</span>
    </div>

    <div class="chosen-container">
      <transition-group name="list">
        <van-tag v-for="(item, index) in sortedChosenItems" :key="item.value" closeable size="large" type="primary"
          class="order-tag" @close="handleRemove(item.value)">
          <span class="index-dot">{{ index + 1 }}</span>
          {{ item.text }}
        </van-tag>
      </transition-group>
      <div v-if="modelValue.length === 0" class="empty-text">请在下方选择选项</div>
    </div>

    <div class="transfer-header">
      <span class="title">备选项</span>
    </div>

    <van-checkbox-group :model-value="modelValue" @update:model-value="onCheckboxChange">
      <van-cell-group inset>
        <van-cell v-for="item in options" :key="item.value" :title="item.text" clickable @click="toggle(item.value)">
          <template #right-icon>
            <van-checkbox :name="item.value" @click.stop shape="square" />
          </template>
        </van-cell>
      </van-cell-group>
    </van-checkbox-group>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  // 所有的选项数据，每个选项的结构为 { value: any, text: string }
  options: {
    type: Array,
    required: true,
    default: () => []
  },
  // 选中的 value 数组（保存了排序顺序）
  modelValue: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:modelValue']);

// 根据 modelValue 的顺序，计算出完整的已选项对象列表
const sortedChosenItems = computed(() => {
  return props.modelValue
    .map(val => props.options.find(opt => opt.value === val))
    .filter(item => !!item);
});

// 处理点击备选项行时的逻辑
const toggle = (val) => {
  const newValue = [...props.modelValue];
  const index = newValue.indexOf(val);

  if (index > -1) {
    newValue.splice(index, 1); // 如果已存在，移除
  } else {
    newValue.push(val); // 如果不存在，推入末尾（实现排序记录）
  }
  emit('update:modelValue', newValue);
};

// 处理 CheckboxGroup 内部触发的变化
const onCheckboxChange = (newVals) => {
  if (newVals.length < props.modelValue.length) {
    const updatedValue = props.modelValue.filter(val => newVals.includes(val));
    emit('update:modelValue', updatedValue);
  } else {
    const addedVal = newVals.find(val => !props.modelValue.includes(val));
    if (addedVal !== undefined) {
      emit('update:modelValue', [...props.modelValue, addedVal]);
    }
  }
};

// 移除特定已选项
const handleRemove = (val) => {
  const newValue = props.modelValue.filter(itemVal => itemVal !== val);
  emit('update:modelValue', newValue);
};
</script>

<style scoped>
.draggable-transfer {
  background: #f7f8fa;
  padding-bottom: 20px;
}

.transfer-header {
  display: flex;
  justify-content: space-between;
  padding: 16px 20px 8px;
  font-size: 14px;
  color: #969799;
}

.chosen-container {
  margin: 0 16px 16px;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  min-height: 44px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.order-tag {
  padding: 4px 8px;
}

.index-dot {
  background: rgba(255, 255, 255, 0.3);
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 10px;
  margin-right: 4px;
}

.empty-text {
  color: #ccc;
  font-size: 13px;
  width: 100%;
  text-align: center;
}

/* 列表动画：让 Tag 的出现和消失更平滑 */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>