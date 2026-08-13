<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getAuthorizeUrl, getCallbackUrl } from '@/service/auth/login'
import { AppRoute } from '@/router/routes'

definePage({
  style: {
    navigationBarTitleText: '正在跳转登录',
    navigationStyle: 'custom',
  },
})

/**
 * 小程序侧的登录宿主页。
 *
 * 用 `<web-view>` 装载 tz-oauth 授权页。
 * 认证完成后，授权页 302 重定向到 static/mp-auth-relay.html 静态中转页，
 * 中转页通过 wx.miniProgram.redirectTo 跳转到原生 subPages/auth/callback 页面完成登录与换会话。
 */
const webviewUrl = ref('')

onLoad((query) => {
  const isLogout = query?.action === 'logout'
  let url = ''

  if (isLogout) {
    const callbackUrl = getCallbackUrl()
    const siteOrigin = callbackUrl
      ? callbackUrl.replace(/\/static\/mp-auth-relay\.html\/?$/, '').replace(/\/subPages\/auth\/callback\/?$/, '')
      : (typeof window !== 'undefined' ? window.location.origin : '')
    url = `${siteOrigin}${AppRoute.AuthLogout}?from=mp`
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
