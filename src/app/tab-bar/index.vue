<script setup lang="ts">
import { onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import MainTabBar from './main-tab-bar.vue'
import { SELECTED_TABBAR_STRATEGY } from './config'

/**
 * 隐藏平台原生底栏。
 *
 * pages.json 里的 tabBar.list 必须保留（uni.switchTab 只认声明过的 tabbar 页），
 * 所以平台默认会画一条原生底栏，和这里的自定义底栏叠在一起。
 * 小程序靠 tabBar.custom 关掉；H5 运行时不认 custom（uni-h5 里没有相关实现），
 * 只能调 uni.hideTabBar()。
 */
function hideNativeTabBar() {
  if (SELECTED_TABBAR_STRATEGY !== 'CUSTOM') {
    return
  }
  // #ifdef H5
  uni.hideTabBar?.({ animation: false })
  // #endif
}

onMounted(hideNativeTabBar)
onShow(hideNativeTabBar)
</script>

<template>
  <MainTabBar />
</template>
