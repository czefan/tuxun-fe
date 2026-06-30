<template>
  <view
    class="sliding-tabs"
    :style="{ padding, gap: tabGap }"
  >
    <view
      v-for="(item, index) in list"
      :key="item.key"
      class="sliding-tab"
      :class="{ 'sliding-tab--active': modelValue === item.key }"
      :style="{ gap }"
      @tap="onTabTap(item.key, index)"
    >
      <text
        class="sliding-tab-title"
        :style="getTitleStyle(item.key === modelValue)"
      >
        {{ item.title }}
      </text>
      <text
        v-if="item.count !== undefined"
        class="sliding-tab-count"
        :style="getCountStyle(item.key === modelValue)"
      >
        {{ item.count }}
      </text>
      <view
        v-if="modelValue === item.key"
        class="sliding-tab-line"
        :style="getLineStyle()"
      />
    </view>
  </view>
</template>

<script lang="ts">
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
    lineColor: '#f5c542',
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

<style scoped lang="scss">
.sliding-tabs {
  display: flex;
  flex-direction: row;
  align-items: center;
  overflow-x: auto;
  white-space: nowrap;
  width: 100%;
  box-sizing: border-box;

  /* 隐藏滚动条 */
  &::-webkit-scrollbar {
    display: none;
    width: 0 !important;
    height: 0 !important;
    -webkit-appearance: none;
    background: transparent;
  }
}

.sliding-tab {
  position: relative;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding-bottom: 12rpx;
  cursor: pointer;
  box-sizing: border-box;
}

.sliding-tab-title {
  font-size: 30rpx;
  font-weight: 500;
  transition: color 0.15s ease-in-out;
}

.sliding-tab--active {
  .sliding-tab-title {
    font-weight: 900;
  }
}

.sliding-tab-count {
  font-size: 22rpx;
  margin-left: 6rpx;
  font-weight: 700;
}

.sliding-tab-line {
  position: absolute;
  bottom: 0;
  height: 6rpx;
  border-radius: 99rpx;
  transition: all 0.15s ease-in-out;
}
</style>
