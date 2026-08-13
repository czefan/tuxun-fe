import { AppRoute, withQuery } from '@/router/routes'
import { currRoute } from '@/router/page'
import { useAuthStore } from '@/store/auth'
import { StorageKey } from '@/constants/storage'

const isDev = import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCK === 'true'

/** 本端绝对 URL；VITE_APP_PUBLIC_BASE 支持子路径部署。H5 页面与登出中转页复用 */
export function absoluteUrl(path: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const base = (import.meta.env.VITE_APP_PUBLIC_BASE || '/').replace(/\/+$/, '')
  return `${origin}${base}${path}`
}

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

/** 顺手清除登录回跳路径 */
export function clearReturnPath() {
  try {
    uni.removeStorageSync(StorageKey.LoginReturnPath)
  }
  catch {}
}

/** tz-oauth 授权服务地址（生产 https://oauth.tiaozhan.com，本地 http://localhost:8088） */
function getOAuthBaseUrl(): string {
  return (import.meta.env.VITE_OAUTH_BASE_URL || '').replace(/\/+$/, '')
}

/** 本服务的 OAuth Client ID */
function getClientId(): string {
  return import.meta.env.VITE_OAUTH_CLIENT_ID || ''
}

/** H5 / 小程序登录回调地址（需与 tz-oauth 管理端与后端白名单注册的 redirect_uri 一致） */
export function getCallbackUrl(): string {
  // #ifdef H5
  return absoluteUrl(AppRoute.AuthCallback)
  // #endif
  // #ifndef H5
  // 小程序流程的 redirect_uri 是静态中转页，不是 H5 的 callback 路由：
  // 中转页只把 code 搬进小程序，登录界面与换取逻辑都在原生端做。
  const raw = import.meta.env.VITE_MP_AUTH_ORIGIN || import.meta.env.VITE_MP_CALLBACK_URL || ''
  const origin = raw.replace(/\/+$/, '').replace(/\/subPages\/auth\/callback\/?$/, '')
  return `${origin}/static/mp-auth-relay.html`
  // #endif
}

/**
 * tz-oauth OIDC 登出地址（SERVICE_INTEGRATION §6）。
 * 未配置 OAuth（含 mock / 本地开发）时返回空串，调用方降级为「只清本地会话」。
 */
export function getLogoutUrl(postLogoutRedirectUri: string): string {
  const base = getOAuthBaseUrl()
  const clientId = getClientId()
  if (!base || !clientId) {
    return ''
  }
  const qs = [
    `client_id=${encodeURIComponent(clientId)}`,
    `post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`,
  ].join('&')
  return `${base}/oauth2/logout?${qs}`
}

/**
 * 跳转 IdP 登出。
 *
 * ⚠️ 只能由「用户主动点退出登录」调用，不要塞进 use-auth 的 logout()。
 * 401 自动登出、登录失败重试也会清会话，那些场景跳 IdP 会让用户下次登录
 * 被迫完整重走一遍学校认证——不是他要求的。
 */
export function redirectToLogout() {
  // #ifdef H5
  // 回跳「我的」页而非首页：用户主动退出后通常留在原地继续操作
  const url = getLogoutUrl(absoluteUrl(AppRoute.My))
  if (!url) {
    // 未配置 OAuth：本地与后端会话已清干净，降级为不跳 IdP，行为与接入前一致
    return
  }
  window.location.href = url
  // #endif
  // #ifndef H5
  uni.navigateTo({ url: withQuery(AppRoute.AuthWebview, { action: 'logout' }) })
  // #endif
}

/** 生成密码学安全 state 并存入 Storage，用于 CSRF 防护（RFC 6749 §10.12） */
function generateState(): string {
  let state = ''
  // #ifdef H5
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  state = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
  try {
    sessionStorage.setItem(StorageKey.OAuthState, state)
  }
  catch {}
  // #endif
  // #ifndef H5
  // 小程序没有 crypto.getRandomValues，用 uni.getRandomValues（Promise）不便于同步拼 URL；
  // 退而用时间戳 + 多段 Math.random 拼足长度。CSRF state 的要求是「不可猜测」，
  // 这里的强度弱于 H5，但远好于现状（现状是完全不发 state）。
  // 若微信基础库支持，优先替换为 wx.getRandomValues 的同步封装。
  state = `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`
  try {
    uni.setStorageSync(StorageKey.OAuthState, state)
  }
  catch {}
  // #endif
  return state
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
  try {
    const stored = uni.getStorageSync(StorageKey.OAuthState)
    uni.removeStorageSync(StorageKey.OAuthState)
    return !!stored && !!state && stored === state
  }
  catch {
    return false
  }
  // #endif
}

/**
 * 拼接 tz-oauth 授权页 URL。
 */
export function getAuthorizeUrl(): string {
  const base = getOAuthBaseUrl()
  const clientId = getClientId()
  const redirectUri = encodeURIComponent(getCallbackUrl())
  let url = `${base}/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=openid%20profile&state=${generateState()}`
  // #ifndef H5
  // 小程序端 web-view 装载统一认证需走 sso_proxy 代理（SSO 会话与图寻后端会话串联）
  url += `&sso_proxy=1`
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
