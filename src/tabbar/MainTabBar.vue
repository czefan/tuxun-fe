<template>
  <view class="main-tab-bar" data-transition-bottom="1" @touchmove.stop.prevent>
    <view
      v-for="(item, index) in tabbarList"
      :key="item.pagePath"
      class="main-tab-bar__item"
      :class="{
        'main-tab-bar__item--active': activeIndex === index,
        'main-tab-bar__item--feedback': feedbackIndex === index,
        'main-tab-bar__item--switching': switchingIndex === index,
      }"
      hover-class="main-tab-bar__item--hover"
      :hover-stay-time="150"
      :aria-current="activeIndex === index ? 'page' : undefined"
      :aria-label="activeIndex === index ? `${getItemText(item)}，当前页` : getItemText(item)"
      @tap.stop="handleTap(item, index)"
    >
      <view class="main-tab-bar__content">
        <view class="main-tab-bar__icon-wrap">
          <wd-icon
            v-if="item.iconType === 'uiLib'"
            class="main-tab-bar__icon"
            :name="getItemIcon(item, index)"
            :color="getItemColor(index)"
            size="46rpx"
          />
          <view
            v-else-if="item.iconType === 'unocss' || item.iconType === 'iconfont'"
            class="main-tab-bar__icon main-tab-bar__class-icon"
            :class="getItemIcon(item, index)"
            :style="{ color: getItemColor(index) }"
          />
          <image
            v-else-if="item.iconType === 'image'"
            class="main-tab-bar__image-icon"
            :src="getItemIcon(item, index)"
            mode="scaleToFill"
          />
        </view>

        <text class="main-tab-bar__text">{{ getItemText(item) }}</text>

        <view v-if="item.badge" class="main-tab-bar__badge-wrap">
          <view v-if="item.badge === 'dot'" class="main-tab-bar__badge-dot" />
          <view v-else class="main-tab-bar__badge">
            {{ item.badge > 99 ? '99+' : item.badge }}
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { CustomTabBarItem } from '@/tabbar/types'
import { computed, ref } from 'vue'
import { triggerTabBarFeedback } from '@/composables/useTabBarFeedback'
import { useTimer } from '@/composables/useTimer'
import { getI18nText } from '@/tabbar/i18n'
import { tabbarCacheEnable } from '@/tabbar/config'
import { normalizeRoutePath, tabbarList, tabbarStore } from '@/tabbar/store'

const props = defineProps<{
  currentIndex?: number
  currentPath?: string
}>()

const emit = defineEmits<{
  (event: 'reselect', item: CustomTabBarItem, index: number): void
}>()

const feedbackIndex = ref<number | null>(null)
const switchingIndex = ref<number | null>(null)
let feedbackTimer: ReturnType<typeof setTimeout> | null = null
const timer = useTimer()

const activeIndex = computed(() => {
  if (typeof props.currentIndex === 'number') {
    return props.currentIndex
  }

  const currentPath = normalizeRoutePath(props.currentPath)

  if (currentPath) {
    const matchedIndex = tabbarList.value.findIndex(
      item => normalizeRoutePath(item.pagePath) === currentPath,
    )

    if (matchedIndex >= 0) {
      return matchedIndex
    }
  }

  const storedIndex = Number(tabbarStore.curIdx)

  return Number.isFinite(storedIndex) ? storedIndex : 0
})

function handleTap(item: CustomTabBarItem, index: number) {
  if (switchingIndex.value !== null) {
    return
  }

  triggerTabBarFeedback()
  flashFeedback(index)

  if (index === activeIndex.value) {
    emit('reselect', item, index)
    return
  }

  if (item.isBulge) {
    uni.showToast({
      title: '点击了中间的鼓包tabbarItem',
      icon: 'none',
    })
    return
  }

  switchingIndex.value = index
  tabbarStore.setCurIdx(index)

  const url = normalizeRoutePath(item.pagePath)
  const navigate = tabbarCacheEnable ? uni.switchTab : uni.navigateTo

  navigate({
    url,
    fail: () => {
      uni.showToast({
        title: '切换失败',
        icon: 'none',
      })
    },
    complete: () => {
      switchingIndex.value = null
    },
  })
}

function flashFeedback(index: number) {
  feedbackIndex.value = index

  if (feedbackTimer) {
    timer.clearTimeout(feedbackTimer)
  }

  feedbackTimer = timer.setTimeout(() => {
    feedbackIndex.value = null
    feedbackTimer = null
  }, 160)
}

function getItemText(item: CustomTabBarItem) {
  return getI18nText(item.text)
}

function getItemIcon(item: CustomTabBarItem, index: number) {
  if (index === activeIndex.value && item.iconActive) {
    return item.iconActive
  }

  return item.icon
}

function getItemColor(index: number) {
  if (feedbackIndex.value === index || switchingIndex.value === index) {
    return '#b98200'
  }

  if (activeIndex.value === index) {
    return '#d4a017'
  }

  return '#9b9b9b'
}
</script>

<style lang="scss">
.main-tab-bar {
  position: fixed;
  right: 0;
  bottom: -1px;
  left: 0;
  z-index: 98;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
  min-height: calc(112rpx + env(safe-area-inset-bottom));
  padding: 4rpx 56rpx calc(8rpx + env(safe-area-inset-bottom));
  background: #ffffff;
  border-top: 1rpx solid rgba(31, 27, 20, 0.08);
  box-shadow: 0 -14rpx 30rpx rgba(31, 27, 20, 0.06);
  box-sizing: border-box;
}

.main-tab-bar__item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 92rpx;
  min-width: 0;
  width: 92rpx;
  height: 90rpx;
  padding-top: 0;
  border-radius: 8rpx;
  box-sizing: border-box;
}

.main-tab-bar__content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 2rpx;
  width: 100%;
  min-width: 0;
  transform: scale(1);
  transition: transform 0.12s ease;
}

.main-tab-bar__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50rpx;
  height: 50rpx;
}

.main-tab-bar__icon,
.main-tab-bar__image-icon {
  display: block;
  line-height: 1;
}

.main-tab-bar__class-icon {
  font-size: 44rpx;
}

.main-tab-bar__image-icon {
  width: 44rpx;
  height: 44rpx;
}

@keyframes mainTabBarContentEntrance {
  0% {
    transform: scale(0.86);
  }
  60% {
    transform: scale(1.04);
  }
  85% {
    transform: scale(0.98);
  }
  100% {
    transform: scale(1);
  }
}

.main-tab-bar__item--active .main-tab-bar__content {
  animation: mainTabBarContentEntrance 0.28s cubic-bezier(0.25, 1, 0.5, 1) forwards;
}

.main-tab-bar__item--hover .main-tab-bar__content,
.main-tab-bar__item--feedback .main-tab-bar__content {
  transform: scale(0.86);
}

.main-tab-bar__text {
  display: block;
  overflow: hidden;
  max-width: 100%;
  font-size: 21rpx;
  font-weight: 700;
  line-height: 1.1;
  color: #999999;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.12s ease;
}

.main-tab-bar__item--active .main-tab-bar__text {
  color: #d4a017;
}

.main-tab-bar__item--hover .main-tab-bar__text,
.main-tab-bar__item--feedback .main-tab-bar__text,
.main-tab-bar__item--switching .main-tab-bar__text {
  color: #b98200;
}

.main-tab-bar__badge-wrap {
  position: absolute;
  top: -2rpx;
  right: 10rpx;
}

.main-tab-bar__badge-dot {
  width: 12rpx;
  height: 12rpx;
  background: #f56c6c;
  border-radius: 999rpx;
}

.main-tab-bar__badge {
  min-width: 28rpx;
  height: 28rpx;
  padding: 0 8rpx;
  font-size: 18rpx;
  font-weight: 800;
  line-height: 28rpx;
  color: #ffffff;
  text-align: center;
  background: #f56c6c;
  border-radius: 999rpx;
  box-sizing: border-box;
}
</style>
