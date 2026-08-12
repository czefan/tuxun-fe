<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { absoluteUrl, getLogoutUrl } from '@/service/auth/login'
import { AppRoute } from '@/router/routes'

definePage({
  style: {
    navigationBarTitleText: '正在退出',
  },
})

onLoad(() => {
  // #ifdef H5
  const logoutUrl = getLogoutUrl(absoluteUrl(AppRoute.AuthLogoutDone))
  if (logoutUrl) {
    // 连续 302 在 web-view 里容易白屏，先落到本站中转页再 location.replace 跳 IdP
    window.location.replace(logoutUrl)
  }
  else {
    // 未配置 OAuth（mock / 本地开发）：本地与后端会话已清干净，直接回「我的」页，不留在此页
    window.location.replace(absoluteUrl(AppRoute.My))
  }
  // #endif
})
</script>

<template>
  <view class="page-auth-logout h-100vh w-full flex items-center justify-center bg-[#F1DFC5] text-[#756C5E]">
    <text class="text-sm font-bold">正在安全退出...</text>
  </view>
</template>
