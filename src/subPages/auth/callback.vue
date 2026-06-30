<template>
  <view class="page-auth-callback">
    <wd-loading type="circular" color="#f5c542" size="44rpx" />
    <text class="page-auth-callback__text">{{ statusText }}</text>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useAuth } from '@/composables/useAuth'
import type { OAuthCallbackQuery } from '@/composables/useAuth'
import { AppRoute, isTabBarRoute } from '@/router/routes'

definePage({
  style: {
    navigationBarTitleText: '%page.loginCallback%',
  },
})

const { handleOAuthCallback } = useAuth()
const statusText = ref('正在完成登录')

onLoad(async (query) => {
  const result = await handleOAuthCallback((query ?? {}) as OAuthCallbackQuery)

  if (!result.success) {
    statusText.value = result.error || '登录失败'
    uni.showToast({
      title: statusText.value,
      icon: 'none',
    })
    setTimeout(() => {
      uni.reLaunch({ url: AppRoute.Home })
    }, 800)
    return
  }

  statusText.value = '登录成功'
  jumpAfterLogin(result.redirectUrl || AppRoute.Home)
})

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
    fail: () => {
      uni.reLaunch({ url: AppRoute.Home })
    },
  })
}
</script>

<style scoped lang="scss">
.page-auth-callback {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 22rpx;
  min-height: 100vh;
  background: #ffffff;
}

.page-auth-callback__text {
  display: block;
  font-size: 28rpx;
  font-weight: 800;
  color: #81786c;
}
</style>
