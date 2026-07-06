<template>
  <view class="page-auth-login box-border min-h-100vh flex items-center justify-center bg-[#f8f7f4] p-48rpx">
    <view class="auth-panel max-w-560rpx w-full flex flex-col items-stretch gap-24rpx">
      <text class="block text-center text-52rpx text-[#211f1b] font-900 leading-[1.1]">图寻</text>
      <text class="mb-24rpx block text-center text-28rpx text-[#81786c] font-700">登录后继续</text>
      <button
        class="h-88rpx w-full flex items-center justify-center border-0 rounded-full bg-brand p-0 text-28rpx text-[#1f1b14] font-800 after:border-none"
        :loading="loading"
        :disabled="loading"
        @tap="handleLogin"
      >
        {{ isMockLoginEnabled ? '本地测试登录' : '统一认证登录' }}
      </button>
      <button
        class="h-88rpx w-full flex items-center justify-center border-0 rounded-full bg-transparent p-0 text-28rpx text-[#81786c] font-800 after:border-none"
        :disabled="loading"
        @tap="goHome"
      >
        暂不登录
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { isMockLoginEnabled, useAuth } from '@/composables/useAuth'
import { AppRoute, isTabBarRoute } from '@/router/routes'

definePage({
  style: {
    navigationBarTitleText: '%page.login%',
  },
})

const { setMockLogin, startOAuthLogin } = useAuth()
const loading = ref(false)
const redirectUrl = ref<string>(AppRoute.Home)

onLoad((query) => {
  redirectUrl.value = normalizeRedirectUrl(query?.redirect)
})

async function handleLogin() {
  if (loading.value) {
    return
  }

  loading.value = true

  try {
    if (isMockLoginEnabled) {
      setMockLogin()
      uni.showToast({
        title: '测试登录成功',
        icon: 'success',
      })
      setTimeout(() => {
        jumpAfterLogin()
      }, 500)
    }
    else {
      await startOAuthLogin({
        returnUrl: redirectUrl.value,
      })
    }
  }
  catch (e) {
    uni.showToast({
      title: '登录失败，请重试',
      icon: 'none',
    })
  }
  finally {
    loading.value = false
  }
}

function goHome() {
  uni.switchTab({
    url: AppRoute.Home,
    fail: () => uni.reLaunch({ url: AppRoute.Home }),
  })
}

function jumpAfterLogin() {
  const url = redirectUrl.value
  if (isTabBarRoute(url)) {
    uni.switchTab({
      url,
      fail: () => uni.reLaunch({ url: AppRoute.Home }),
    })
    return
  }

  uni.redirectTo({
    url,
    fail: () => {
      uni.reLaunch({ url: AppRoute.Home })
    },
  })
}

function normalizeRedirectUrl(value: any): string {
  if (typeof value === 'string' && value.startsWith('/')) {
    return value
  }
  return AppRoute.Home
}
</script>
