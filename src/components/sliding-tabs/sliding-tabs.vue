<template>
  <view
    class="box-border w-full flex flex-row items-center overflow-x-auto whitespace-nowrap scrollbar-none"
    :style="{ padding, gap: tabGap }"
  >
    <view
      v-for="(item, index) in list"
      :key="item.key"
      class="relative box-border flex flex-shrink-0 cursor-pointer items-center pb-12rpx"
      :style="{ gap }"
      @tap="onTabTap(item.key, index)"
    >
      <text
        class="transition-colors duration-150 ease-in-out"
        :class="[modelValue === item.key ? 'font-900' : 'font-500']"
        :style="getTitleStyle(item.key === modelValue)"
      >
        {{ item.title }}
      </text>
      <text
        v-if="item.count !== undefined"
        class="ml-6rpx text-22rpx font-700"
        :style="getCountStyle(item.key === modelValue)"
      >
        {{ item.count }}
      </text>
      <view
        v-if="modelValue === item.key"
        class="absolute bottom-0 h-6rpx rounded-full transition-all duration-150 ease-in-out"
        :style="getLineStyle()"
      />
    </view>
  </view>
</template>

<script lang="ts">
import { BRAND_PRIMARY_COLOR } from '@/styles/constants'

export interface TabItem {
  key: string
  title: string
  count?: string | number
}

export default {
  options: {
    virtualHost: true,
  },
}
</script>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    list: TabItem[]
    modelValue: string
    activeColor?: string
    inactiveColor?: string
    activeCountColor?: string
    inactiveCountColor?: string
    lineColor?: string
    lineWidth?: string
    gap?: string
    tabGap?: string
    padding?: string
    fontSize?: string
  }>(),
  {
    activeColor: '#1f1b14',
    inactiveColor: '#8f8679',
    activeCountColor: '#9b7621',
    inactiveCountColor: '#aaa39a',
    lineColor: BRAND_PRIMARY_COLOR,
    gap: '10rpx',
    tabGap: '48rpx',
    padding: '8rpx 24rpx 28rpx',
    fontSize: '30rpx',
  },
)
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string, index: number): void
}>()
function onTabTap(key: string, index: number) {
  emit('update:modelValue', key)
  emit('change', key, index)
}

function getTitleStyle(isActive: boolean) {
  return {
    color: isActive ? props.activeColor : props.inactiveColor,
    fontSize: props.fontSize,
  }
}

function getCountStyle(isActive: boolean) {
  return {
    color: isActive ? props.activeCountColor : props.inactiveCountColor,
  }
}

function getLineStyle() {
  const style: Record<string, string> = {
    background: props.lineColor,
  }
  if (props.lineWidth) {
    style.width = props.lineWidth
    style.left = '50%'
    style.transform = 'translateX(-50%)'
  }
  else {
    style.left = '0'
    style.right = '0'
  }
  return style
}
</script>
