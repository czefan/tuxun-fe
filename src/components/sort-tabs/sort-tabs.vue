<template>
  <view class="sort-tabs">
    <view
      v-for="(item, index) in displayOptions"
      :key="item.name"
      class="sort-pill"
      :class="{ 'sort-pill--active': modelValue === index }"
      @tap="selectTab(index)"
    >
      <text class="sort-pill__text">{{ item.name }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { t } from '@/locale'

interface SortOption {
  name: string
}

interface Props {
  modelValue: number
  options?: SortOption[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
  (e: 'change', value: number): void
}>()

const displayOptions = computed(() =>
  props.options?.length
    ? props.options
    : [{ name: t('common.hot') }, { name: t('common.latest') }],
)

function selectTab(index: number) {
  if (props.modelValue === index)
    return
  emit('update:modelValue', index)
  emit('change', index)
}
</script>

<style scoped lang="scss">
.sort-tabs {
  display: flex;
  gap: 4rpx;
  width: 200rpx;
  padding: 4rpx;
  margin: 0 4rpx 20rpx;
  background: rgba(232, 225, 217, 0.65);
  border-radius: 999rpx;
}

.sort-pill {
  flex: 1;
  padding: 8rpx 0;
  border-radius: 999rpx;
  transition: all 0.22s cubic-bezier(0.22, 1, 0.36, 1);
}

.sort-pill--active {
  background: #ffffff;
  box-shadow: 0 4rpx 12rpx rgba(33, 31, 27, 0.08);
}

.sort-pill__text {
  display: block;
  font-size: 22rpx;
  font-weight: 800;
  text-align: center;
  color: #6f6960;
  transition: color 0.2s ease;
}

.sort-pill--active .sort-pill__text {
  color: #211f1b;
}
</style>
