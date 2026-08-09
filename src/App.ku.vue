<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import FgTabbar from '@/app/tab-bar/index.vue'
import AppGlobalProvider from '@/app/components/app-global-provider/app-global-provider.vue'
import { isTabBarPage } from '@/app/tab-bar/store'
import { currRoute } from '@/router/page'

// 底栏只在 tabbar 页显示；分包详情页不得出现底栏。
// 线上 H5 根路径 '/' 的归一化由 normalizeRoutePath 负责（见 tab-bar/store.ts）。
const isCurrentPageTabbar = ref(true)

onShow(() => {
  const { path } = currRoute()
  isCurrentPageTabbar.value = isTabBarPage(path)
})
</script>

<template>
  <view>
    <KuRootView />

    <FgTabbar v-if="isCurrentPageTabbar" />
    <AppGlobalProvider />
  </view>
</template>
