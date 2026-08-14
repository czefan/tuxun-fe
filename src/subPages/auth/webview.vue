<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getAuthorizeUrl, getCallbackUrl, getLogoutUrl, getSiteOrigin } from '@/service/auth/login'
import { AppRoute } from '@/router/routes'

definePage({
  style: {
    navigationBarTitleText: '正在跳转登录',
    navigationStyle: 'custom',
  },
})

/**
 * 小程序侧的登录与登出宿主页。
 *
 * 登录：用 `<web-view>` 装载 tz-oauth 授权页，完成后跳 static/mp-auth-relay.html。
 * 登出：用 `<web-view>` 装载 static/mp-logout-relay.html，IdP 清会话后跳 static/mp-logout-done.html 回到「我的」页。
 */
const webviewUrl = ref('')

onLoad((query) => {
  const isLogout = query?.action === 'logout'
  let url = ''

  if (isLogout) {
    const origin = getSiteOrigin()
    const target = getLogoutUrl(`${origin}/static/mp-logout-done.html`)
    if (!target) {
      // OAuth 未配置（mock / 本地开发）：本地与后端会话已清干净，IdP 无可登出，直接回「我的」页
      uni.switchTab({ url: AppRoute.My })
      return
    }
    url = `${origin}/static/mp-logout-relay.html?target=${encodeURIComponent(target)}`
  }
  else {
    url = getAuthorizeUrl()
  }

  const callbackUrl = getCallbackUrl()
  if ((!url.startsWith('http://') && !url.startsWith('https://')) || (!isLogout && !callbackUrl)) {
    uni.showModal({
      title: '登录服务未配置',
      content: '当前构建缺少 OAuth 配置，请联系管理员配置 VITE_OAUTH_BASE_URL、VITE_OAUTH_CLIENT_ID 与 VITE_MP_AUTH_ORIGIN。',
      showCancel: false,
    })
    return
  }
  webviewUrl.value = url
})
</script>

<template>
  <view class="page-auth-webview h-100vh w-full">
    <web-view v-if="webviewUrl" :src="webviewUrl" />
  </view>
</template>
