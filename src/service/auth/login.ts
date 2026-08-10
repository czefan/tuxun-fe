import { AppRoute } from '@/router/routes'
import { currRoute } from '@/router/page'
import { useAuthStore } from '@/store/auth'
import { StorageKey } from '@/constants/storage'

const isDev = import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCK === 'true'

/** 记录发起登录时所在页面，登录成功后回到这里（仅 H5 有效） */
function saveReturnPath() {
  // #ifdef H5
  // 小程序走 web-view + navigateBack，页面栈里原页面还在，不需要回跳路径；
  // 且回调页是线上 H5 产物，读不到小程序的 uni.setStorageSync，存了也无人消费。
  try {
    const { path, query } = currRoute()
    if (!path || path.startsWith(AppRoute.AuthCallback) || path.startsWith(AppRoute.AuthWebview)) {
      return
    }
    const qs = Object.entries(query || {})
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&')
    uni.setStorageSync(StorageKey.LoginReturnPath, qs ? `${path}?${qs}` : path)
  }
  catch {}
  // #endif
}

/**
 * 取出并清除回跳地址。
 * 只接受站内绝对路径（/pages/ 或 /subPages/ 开头），
 * 杜绝开放重定向风险。
 */
export function takeReturnPath(): string {
  try {
    const saved = uni.getStorageSync(StorageKey.LoginReturnPath)
    uni.removeStorageSync(StorageKey.LoginReturnPath)
    if (typeof saved === 'string' && /^\/(?:pages|subPages)\//.test(saved)) {
      return saved
    }
  }
  catch {}
  return ''
}

/** tz-oauth 授权服务地址（生产 https://oauth.tiaozhan.com，本地 http://localhost:8088） */
function getOAuthBaseUrl(): string {
  return (import.meta.env.VITE_OAUTH_BASE_URL || '').replace(/\/+$/, '')
}

/** 本服务的 OAuth Client ID */
function getClientId(): string {
  return import.meta.env.VITE_OAUTH_CLIENT_ID || ''
}

/** H5 登录回调页完整 URL（需与 tz-oauth 管理端注册的 redirect_uri 一致） */
export function getCallbackUrl(): string {
  // #ifdef H5
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  // VITE_APP_PUBLIC_BASE 支持子路径部署（如 /doc/）；去掉尾斜杠避免与回调页实际地址不一致
  const base = (import.meta.env.VITE_APP_PUBLIC_BASE || '/').replace(/\/+$/, '')
  return `${origin}${base}${AppRoute.AuthCallback}`
  // #endif
  // #ifndef H5
  // 小程序走 web-view 内嵌 H5，回调地址是 H5 的线上地址，需通过环境变量注入。
  // 去掉尾斜杠：后端白名单要求授权阶段的 redirect_uri 与回跳页实际 URL 完全一致，
  // 配成带斜杠会两边不一致直接 400。
  return (import.meta.env.VITE_MP_CALLBACK_URL || '').replace(/\/+$/, '')
  // #endif
}

/** 生成密码学安全 state 并存入 sessionStorage，用于 CSRF 防护（RFC 6749 §10.12） */
function generateState(): string {
  // #ifdef H5
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  const state = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
  try {
    sessionStorage.setItem(StorageKey.OAuthState, state)
  }
  catch {}
  return state
  // #endif
  // #ifndef H5
  // 小程序端不携带 state（无 sessionStorage 可存，回调也在另一份 H5 产物里）
  return ''
  // #endif
}

/** 校验回调中的 state 是否与发起时一致，校验后立即清除 */
export function validateAndClearState(state: string): boolean {
  // #ifdef H5
  try {
    const stored = sessionStorage.getItem(StorageKey.OAuthState)
    sessionStorage.removeItem(StorageKey.OAuthState)
    // stored 为空表示本端没发起过这次登录（非本站跳转）；state 为空表示回调没带 state，一律拒绝
    return !!stored && !!state && stored === state
  }
  catch {
    return false
  }
  // #endif
  // #ifndef H5
  return true
  // #endif
}

/**
 * 拼接 tz-oauth 授权页 URL。
 *
 * state 只在 H5 追加：state 由发起端生成并存入 sessionStorage，回跳后的回调页
 * 也是同一份 H5 产物，才能校验通过。小程序 web-view 流程的发起端（mp 构建）
 * 没有 sessionStorage，state 无处可存；而回跳目标是线上 H5 回调页，它校验时
 * 只会查自己的 sessionStorage（为空）→ 必然「登录状态校验失败」。
 * 所以小程序端不携带 state（SERVICE_INTEGRATION.md 中 state 为强烈建议非必填）。
 */
export function getAuthorizeUrl(): string {
  const base = getOAuthBaseUrl()
  const clientId = getClientId()
  const redirectUri = encodeURIComponent(getCallbackUrl())
  let url = `${base}/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=openid%20profile`
  // #ifdef H5
  url += `&state=${generateState()}`
  // #endif
  return url
}

/** 真正跳转统一身份认证。不含开发模式分支——调用方已经决定要去 OAuth 了。 */
export function redirectToOAuth() {
  saveReturnPath()
  const url = getAuthorizeUrl()
  // #ifdef H5
  // 与 webview.vue 的守卫对称：VITE_OAUTH_BASE_URL 未配置时 URL 是相对路径，
  // 直接跳转会落到 SPA fallback 上白屏，这里给出可操作的提示。
  if (!/^https?:\/\//.test(url)) {
    uni.showModal({
      title: '登录服务未配置',
      content: '当前构建缺少 OAuth 配置，请联系管理员配置 VITE_OAUTH_BASE_URL 与 VITE_OAUTH_CLIENT_ID。',
      showCancel: false,
    })
    return
  }
  window.location.href = url
  // #endif
  // #ifndef H5
  // 小程序登录态走 X-Session-Id：由 subPages/auth/webview 用 <web-view> 装载统一认证，
  // 认证完成后 postMessage 回传 sessionId（见 AppRoute.AuthWebview）。
  uni.navigateTo({ url: AppRoute.AuthWebview })
  // #endif
}

/** 触发登录流程：开发模式先弹调试确认框，生产模式直达 OAuth */
export function loginDirectly() {
  if (isDev) {
    useAuthStore().openLoginModal()
    return
  }
  redirectToOAuth()
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
