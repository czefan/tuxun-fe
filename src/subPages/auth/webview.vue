<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getLoginUrl } from '@/service/auth/login'
import { useAuthStore } from '@/store/auth'

definePage({
  style: {
    navigationBarTitleText: '登录认证',
  },
})

/**
 * 小程序侧的登录宿主页。
 *
 * 小程序没有 cookie，登录态只能走 `X-Session-Id`。这里用 `<web-view>` 装载统一认证，
 * 认证完成后由内部的 H5 回调页 postMessage 把 session_id 送回来。
 *
 * **handleMessage 里只做同步的事。** 微信的 postMessage 是在 web-view 销毁时
 * 才批量投递的——消息到达时本页正在被 navigateBack 拆掉，
 * 在这里 await 网络请求再跳转，等于把导航压在一个随时会消失的页面上。
 * 拉个人资料交给 App 级 onShow（use-app-lifecycle.ts 会接手 validateStoredSession）。
 */
const webviewUrl = ref('')
const authStore = useAuthStore()

onLoad(() => {
  const url = getLoginUrl()
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    uni.showModal({
      title: '登录服务未配置',
      content: '当前构建缺少 API 域名配置，请联系管理员配置 VITE_SERVER_BASEURL。',
      showCancel: false,
    })
    return
  }
  webviewUrl.value = url
})

function handleMessage(e: { detail?: { data?: unknown } }) {
  const dataList = e.detail?.data
  if (!Array.isArray(dataList)) {
    return
  }

  // 批量投递，倒序取最后一条有效消息
  for (let i = dataList.length - 1; i >= 0; i--) {
    const sessionId = (dataList[i] as { sessionId?: unknown })?.sessionId
    if (typeof sessionId === 'string' && sessionId) {
      // 同步写入并落盘（pinia-plugin-persistedstate 同步写 storage）
      authStore.setSessionId(sessionId)
      return
    }
  }
}
</script>

<template>
  <view class="page-auth-webview h-100vh w-full">
    <web-view v-if="webviewUrl" :src="webviewUrl" @message="handleMessage" />
  </view>
</template>
