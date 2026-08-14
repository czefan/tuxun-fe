<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useAuth } from '@/features/user/composables/use-auth'
import { useUserStore } from '@/features/user/store/user'
import { getCallbackUrl, redirectToOAuth, takeReturnPath, validateAndClearState } from '@/service/auth/login'
import { AppRoute } from '@/router/routes'
import { BRAND_PRIMARY_COLOR } from '@/styles/constants'
import { ApiRequestError } from '@/service/request/error'

definePage({
  style: {
    navigationBarTitleText: '%page.loginCallback%',
  },
})

const { handleCallback } = useAuth()
const userStore = useUserStore()
const statusText = ref('正在完成登录')
const isError = ref(false)

function retryLogin() {
  userStore.logout()
  if (typeof window !== 'undefined') {
    window.history.replaceState({}, '', window.location.pathname)
  }
  redirectToOAuth()
}

function extractParam(query: Record<string, any>, keys: string[]): string {
  for (const k of keys) {
    if (typeof query?.[k] === 'string' && query[k]) {
      return query[k]
    }
  }
  if (typeof window !== 'undefined') {
    const searchParams = new URLSearchParams(window.location.search)
    for (const k of keys) {
      const val = searchParams.get(k)
      if (val)
        return val
    }
  }
  return ''
}

onLoad(async (query: Record<string, any> = {}) => {
  const casError = extractParam(query, ['error_description', 'error'])
  if (casError) {
    statusText.value = `统一认证系统返回错误: ${decodeURIComponent(casError).replace(/\+/g, ' ')}`
    isError.value = true
    return
  }

  // 校验 state（防 CSRF）
  const state = extractParam(query, ['state'])
  if (!validateAndClearState(state)) {
    statusText.value = '登录状态校验失败，请重新登录'
    isError.value = true
    return
  }

  // 严格按 contract/api.md 契约提取 OAuth2 一次性凭据：参数名固定为 code。
  const code = extractParam(query, ['code'])

  if (!code) {
    statusText.value = '登录参数无效'
    isError.value = true
    return
  }

  try {
    const redirectUri = getCallbackUrl()
    await handleCallback(code, redirectUri)
    statusText.value = '登录成功'

    // #ifdef H5
    setTimeout(() => {
      const target = takeReturnPath() || AppRoute.Home
      if (typeof window !== 'undefined') {
        window.location.replace(target)
      }
      else {
        uni.reLaunch({ url: target })
      }
    }, 300)
    // #endif
    // #ifndef H5
    // 小程序：webview 宿主页已被中转页 redirectTo 替换，栈里紧邻的就是发起登录的页面
    setTimeout(() => {
      uni.navigateBack({
        fail: () => uni.switchTab({ url: AppRoute.Home }),
      })
    }, 500)
    // #endif
  }
  catch (err: unknown) {
    userStore.logout()
    isError.value = true
    // ApiRequestError.code 是契约业务码，判 HTTP 400 看 statusCode。
    // OAuth code 一次性且 ≤5 分钟有效，过期/重放都是 400。
    if (err instanceof ApiRequestError && err.statusCode === 400) {
      statusText.value = '登录链接已失效，请重新登录'
    }
    else {
      statusText.value = '登录失败，请稍后重试'
    }
  }
})
</script>

<template>
  <view class="page-auth-callback min-h-100vh flex flex-col items-center justify-center gap-24rpx bg-white p-32rpx">
    <wd-loading v-if="!isError" type="circular" :color="BRAND_PRIMARY_COLOR" size="44rpx" />
    <text class="block text-center text-28rpx text-[#81786c] font-800">{{ statusText }}</text>
    <wd-button
      v-if="isError"
      type="warning"
      round
      size="medium"
      custom-class="!mt-4 !font-bold shadow-md"
      @click="retryLogin"
    >
      重新登录
    </wd-button>
  </view>
</template>
