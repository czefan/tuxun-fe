<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { absoluteUrl } from '@/service/auth/login'
import { AppRoute } from '@/router/routes'
import { relaunchMiniProgram } from '@/utils/mp-webview'

definePage({
  style: {
    navigationBarTitleText: '已退出',
  },
})

onLoad(async () => {
  // #ifdef H5
  // 登出完成后回「我的」页（与 H5 端 post_logout_redirect_uri 指向一致）
  const success = await relaunchMiniProgram(AppRoute.My)
  if (!success) {
    // H5 直开（非小程序 webview）：同样回「我的」页
    window.location.href = absoluteUrl(AppRoute.My)
  }
  // #endif
})
</script>

<template>
  <view class="page-auth-logout-done h-100vh w-full flex items-center justify-center bg-[#F1DFC5] text-[#756C5E]">
    <text class="text-sm font-bold">退出完成，正在返回...</text>
  </view>
</template>
