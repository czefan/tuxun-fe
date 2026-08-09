import { API_BASE_PATH, getEnvBaseUrl } from '@/service/request/env'
import { AppRoute } from '@/router/routes'
import { useAuthStore } from '@/store/auth'

/** 统一身份认证入口 GET /user/login（302 全页重定向，前端只用它拼跳转地址，须直连后端完整 URL 避免 Node 代理吃掉 302） */
export function getLoginUrl(): string {
  const apiPath = `${API_BASE_PATH}/user/login?client=fe`
  const baseUrl = getEnvBaseUrl()
  return `${baseUrl}${apiPath}`
}

const isDev = import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCK === 'true'

/** 真正跳转统一身份认证。不含开发模式分支——调用方已经决定要去 CAS 了。 */
export function redirectToCas() {
  const url = getLoginUrl()
  // #ifdef H5
  window.location.href = url
  // #endif
  // #ifndef H5
  // 小程序登录态走 X-Session-Id：由 subPages/auth/webview 用 <web-view> 装载统一认证，
  // 认证完成后 postMessage 回传 sessionId（见 AppRoute.AuthWebview）。
  uni.navigateTo({ url: AppRoute.AuthWebview })
  // #endif
}

/** 触发登录流程：开发模式先弹调试确认框，生产模式直达 CAS */
export function loginDirectly() {
  if (isDev) {
    useAuthStore().openLoginModal()
    return
  }
  redirectToCas()
}

/** 具体操作的前置登录拦截：未登录时弹「取消 / 去登录」确认框 */
export function requireLogin(onCancel?: () => void): boolean {
  if (useAuthStore().isLoggedIn) {
    return true
  }
  uni.showModal({
    title: '提示',
    content: '需要登录后才能继续操作，是否前往登录？',
    confirmText: '去登录',
    cancelText: '取消',
    confirmColor: '#B69171',
    success: (res) => {
      if (res.confirm) {
        loginDirectly()
      }
      else {
        onCancel?.()
      }
    },
    fail: () => {
      onCancel?.()
    },
  })
  return false
}
