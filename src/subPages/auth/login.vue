<template>
  <view class="page-auth-login">
    <view class="auth-panel">
      <text class="auth-panel__brand">图寻</text>
      <text class="auth-panel__title">登录后继续</text>
      <button
        class="auth-panel__button"
        :loading="loading"
        :disabled="loading"
        @tap="handleLogin"
      >
        {{ isMockLoginEnabled ? '本地测试登录' : '统一认证登录' }}
      </button>
      <button class="auth-panel__ghost" :disabled="loading" @tap="goHome">
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
      jumpAfterLogin(redirectUrl.value)
      return
    }

    await startOAuthLogin({
      returnUrl: redirectUrl.value,
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

function jumpAfterLogin(url: string) {
  if (isTabBarRoute(url)) {
    uni.switchTab({
      url,
      fail: () => uni.reLaunch({ url: AppRoute.Home }),
    })
    return
  }

  uni.redirectTo({
    url,
    fail: () => uni.reLaunch({ url: AppRoute.Home }),
  })
}

function normalizeRedirectUrl(value: unknown) {
  if (typeof value !== 'string' || !value) {
    return AppRoute.Home
  }

  try {
    return decodeURIComponent(value)
  }
  catch {
    return value
  }
}
</script>

<style scoped lang="scss">
.page-auth-login {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 48rpx;
  background: #f8f7f4;
  box-sizing: border-box;
}

.auth-panel {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  max-width: 560rpx;
  gap: 24rpx;
}

.auth-panel__brand,
.auth-panel__title {
  display: block;
  text-align: center;
  color: #211f1b;
}

.auth-panel__brand {
  font-size: 52rpx;
  font-weight: 900;
  line-height: 1.1;
}

.auth-panel__title {
  margin-bottom: 24rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: #81786c;
}

.auth-panel__button,
.auth-panel__ghost {
  width: 100%;
  height: 88rpx;
  border-radius: 999rpx;
  font-size: 28rpx;
  font-weight: 800;
}

.auth-panel__button {
  color: #1f1b14;
  background: var(--tx-color-primary);
}

.auth-panel__ghost {
  color: #81786c;
  background: transparent;
}
</style>
