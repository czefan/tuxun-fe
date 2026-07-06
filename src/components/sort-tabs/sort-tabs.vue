<template>
  <view class="mx-4rpx mb-20rpx w-200rpx flex gap-4rpx rounded-full bg-[#e8e1d9]/65 p-4rpx">
    <view
      v-for="(item, index) in displayOptions"
      :key="item.name"
      class="flex-1 rounded-full py-8rpx transition-all duration-220 ease-[cubic-bezier(0.22,1,0.36,1)]"
      :class="modelValue === index ? 'bg-white shadow-[0_4rpx_12rpx_rgba(33,31,27,0.08)]' : ''"
      @tap="selectTab(index)"
    >
      <text
        class="block text-center text-22rpx font-800 transition-colors duration-200 ease-in-out"
        :class="modelValue === index ? 'text-[#211f1b]' : 'text-[#6f6960]'"
      >
        {{ item.name }}
      </text>
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
