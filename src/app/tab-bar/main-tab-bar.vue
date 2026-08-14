<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getTranslatedTabBarList } from './i18n'
import { useTabBarStore } from './store'
import type { CustomTabBarItem } from './types'
import { useUserStore } from '@/features/user'
import { AppRoute } from '@/router/routes'

const store = useTabBarStore()
const user = useUserStore()
const list = computed(() => getTranslatedTabBarList(user.userInfo?.level ?? 1))

onMounted(() => store.syncCurrentPagePathAsync())
onShow(() => store.syncCurrentPagePathAsync())

function isItemActive(item: CustomTabBarItem): boolean {
  if (!item.pagePath)
    return false
  const path = item.pagePath.startsWith('/') ? item.pagePath : `/${item.pagePath}`
  return store.currentPagePath.value === path
}

function switchTab(item: CustomTabBarItem) {
  // #ifndef H5
  uni.vibrateShort({ type: 'light', fail: () => {} })
  // #endif
  if (item.pagePath) {
    store.setCurrentPagePath(item.pagePath)
    const url = `/${item.pagePath.replace(/^\/+/, '')}`
    uni.switchTab({
      url,
      fail: () => uni.reLaunch({
        url,
        fail: (err) => {
          uni.showToast({ title: '页面切换失败', icon: 'none' })
          console.error('[nav]', err)
        },
      }),
    })
  }
}

function publish() {
  // #ifndef H5
  uni.vibrateShort({ type: 'light', fail: () => {} })
  // #endif
  uni.navigateTo({ url: AppRoute.Contribute })
}
</script>

<template>
  <view class="main-tab-bar" @touchmove.stop.prevent>
    <template v-for="(item, i) in list" :key="item.pagePath || item.type || i">
      <!-- 中间 投稿加号按键 (由数据项 item.type === 'publish' 驱动) -->
      <view v-if="item.type === 'publish'" class="tab-item tab-center" @tap.stop="publish">
        <view class="h-9 w-12 flex items-center justify-center rounded-2xl bg-[#f9df95] shadow-sm transition-transform -translate-y-1 active:scale-90">
          <text class="i-carbon-add text-22px text-[#1e1e1e] font-black" />
        </view>
      </view>

      <view
        v-else
        class="tab-item"
        :class="{ active: isItemActive(item) }"
        @tap.stop="switchTab(item)"
      >
        <view class="tab-content">
          <wd-icon
            v-if="item.iconType === 'wd'"
            class="tab-icon-wd"
            :name="isItemActive(item) ? (item.iconActive || item.icon) : item.icon"
            :color="isItemActive(item) ? '#f9df95' : '#eedcc7'"
            size="52rpx"
          />
          <text
            v-else
            class="tab-icon"
            :class="[isItemActive(item) ? (item.iconActive || item.icon) : item.icon]"
            :style="{ color: isItemActive(item) ? '#f9df95' : '#eedcc7' }"
          />
          <text class="tab-text" :style="{ color: isItemActive(item) ? '#f9df95' : '#eedcc7' }">{{ item.text }}</text>
        </view>
      </view>
    </template>
  </view>
</template>

<style lang="scss">
.main-tab-bar {
  @apply fixed -bottom-[1px] left-0 right-0 z-50 flex items-center justify-around w-full h-[calc(var(--tx-tabbar-height)+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] bg-[#b69171] border-t border-[#d3ba9f] shadow-lg box-border;
}

.tab-item {
  @apply relative flex-1 flex items-center justify-center h-full cursor-pointer;

  &.tab-center {
    @apply flex-none w-[110rpx];
  }
}

.tab-content {
  @apply flex flex-col items-center justify-center gap-0.5 transition-transform duration-150;
}

@keyframes tabEntrance {
  0% {
    transform: scale(0.88);
  }
  50% {
    transform: scale(1.06);
  }
  80% {
    transform: scale(0.98);
  }
  100% {
    transform: scale(1);
  }
}

.tab-item.active .tab-content {
  animation: tabEntrance 0.28s cubic-bezier(0.25, 1, 0.5, 1) forwards;
}

.tab-icon {
  @apply block text-[42rpx] transition-colors duration-150;
}

.tab-icon-wd {
  @apply block transition-colors duration-150;
}

.tab-text {
  @apply block text-[20rpx] font-medium transition-colors duration-150;
}

.tab-item.active .tab-text {
  @apply font-bold;
}
</style>
