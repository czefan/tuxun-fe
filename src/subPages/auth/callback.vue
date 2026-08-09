<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useAuth } from '@/features/user/composables/use-auth'
import { useUserStore } from '@/features/user/store/user'
import { redirectToCas } from '@/service/auth/login'
import { AppRoute } from '@/router/routes'
import { BRAND_PRIMARY_COLOR } from '@/styles/constants'
import { ApiRequestError } from '@/service/request/error'
import { postSessionToMiniProgram } from '@/utils/mp-webview'

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
  redirectToCas()
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
    // 保留以兼容 Hash 路由模式，History 模式下不会命中
    const hashIndex = window.location.hash.indexOf('?')
    if (hashIndex !== -1) {
      const hashParams = new URLSearchParams(window.location.hash.substring(hashIndex))
      for (const k of keys) {
        const val = hashParams.get(k)
        if (val)
          return val
      }
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

  // 严格按 contract/api.md 契约提取 CAS 一次性凭据：参数名固定为 guid。
  // 不要"顺手兼容" OAuth 的 code / ticket —— 后端不认，取错值只会得到 400，
  // 而 400 在下面被翻译成「登录链接已失效」，会把排查方向带偏到凭据有效期上。
  const guid = extractParam(query, ['guid'])

  if (!guid) {
    statusText.value = '登录参数无效'
    isError.value = true
    return
  }

  try {
    const res = await handleCallback(guid)
    statusText.value = '登录成功'

    // 跑在小程序 <web-view> 里时，把 session_id 回传给宿主并返回小程序。
    // 成功交接后本页就不再自己跳转了——宿主会接管。
    // #ifdef H5
    const handedOff = await postSessionToMiniProgram(res?.sessionId || '')
    if (handedOff) {
      statusText.value = '登录成功，正在返回小程序'
      return
    }
    // #endif

    setTimeout(() => {
      uni.switchTab({ url: AppRoute.Home })
    }, 500)
  }
  catch (err: unknown) {
    userStore.logout()
    isError.value = true
    // 注意：ApiRequestError.code 是**契约业务码**（code=0 成功），不是 HTTP 状态码，
    // 判 HTTP 400 只能看 statusCode。OAuth code 一次性且 ≤5 分钟有效，过期/重放都是 400。
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
