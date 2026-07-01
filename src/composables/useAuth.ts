/**
 * 登录状态 & OAuth Token 守卫 Composable
 */
import { getOAuthLoginUrl, getUserInfo, loginByOAuthCode } from '@/service/api'
import { useUserStore } from '@/store/user'
import type { UserInfo } from '@/types/business'
import { StorageKey } from '@/constants'
import { AppRoute } from '@/router/routes'
import { BRAND_PRIMARY_COLOR } from '@/styles/constants'

const oauthRedirectTtl = 10 * 60 * 1000
const oauthRedirectWindow = 5 * 1000
const oauthRedirectLimit = 2

export const isMockLoginEnabled = import.meta.env.MODE !== 'production' && import.meta.env.VITE_USE_MOCK_LOGIN === 'true'

export interface StartOAuthLoginOptions {
  redirectUri?: string
  returnUrl?: string
  state?: string
}

export type OAuthCallbackQuery = Record<string, string | number | boolean | undefined>

export interface OAuthLoginResult {
  token: string
  redirectUrl: string
}

export interface OAuthCallbackResult {
  success: boolean
  redirectUrl?: string
  error?: string
}

/**
 * 登录态管理组合式函数
 */
export function useAuth() {
  const userStore = useUserStore()

  /**
   * 检查是否已登录，未登录则根据环境引导 Mock 登录或 OAuth 统一认证。
   * 跳转会离开当前页面，因此返回 false 表示本次交互已被登录流程接管。
   */
  async function ensureLogin(): Promise<boolean> {
    if (userStore.isLoggedIn()) {
      return true
    }

    const confirmed = await confirmLogin()

    if (!confirmed) {
      return false
    }

    if (isMockLoginEnabled) {
      goMockLoginPage()
      return false
    }

    await startOAuthLogin()
    return false
  }

  /** 跳转 OAuth 统一认证登录页 */
  async function startOAuthLogin(options: StartOAuthLoginOptions = {}) {
    if (isOAuthRedirectCircuitOpen()) {
      showOAuthRecoveryModal()
      return
    }

    const returnUrl = options.returnUrl ?? getCurrentReturnUrl()
    const redirectUri = options.redirectUri ?? getOAuthRedirectUri(returnUrl)
    const state = options.state ?? createOAuthState()

    uni.setStorageSync(StorageKey.OAuthRedirectUri, redirectUri)
    uni.setStorageSync(StorageKey.OAuthState, state)
    setStoredReturnUrl(returnUrl)

    try {
      uni.showLoading({ title: '正在准备登录', mask: true })
      uni.showNavigationBarLoading()
      const { loginUrl } = await getOAuthLoginUrl({ redirectUri, returnUrl, state })

      recordOAuthRedirectAttempt()
      redirectToOAuthProvider(loginUrl)
    }
    catch {
      uni.showToast({ title: '登录失败', icon: 'none' })
    }
    finally {
      uni.hideLoading()
      uni.hideNavigationBarLoading()
    }
  }

  /** OAuth 回调页拿到 authorization code 后调用 */
  async function completeOAuthLogin(
    code: string,
    redirectUri = getStoredRedirectUri(),
    state?: string,
  ): Promise<OAuthLoginResult> {
    const { token, userInfo } = await loginByOAuthCode({ code, redirectUri, state })
    const redirectUrl = getStoredReturnUrl()

    userStore.setToken(token)
    userStore.setUserInfo(userInfo)

    clearOAuthLoginState()

    return {
      token,
      redirectUrl,
    }
  }

  /** OAuth callback 页可直接传入 onLoad query 完成登录态落地 */
  async function handleOAuthCallback(query: OAuthCallbackQuery): Promise<OAuthCallbackResult> {
    const callbackError = getQueryValue(query, 'error')

    if (callbackError) {
      return {
        success: false,
        error: getQueryValue(query, 'errorDescription') || getQueryValue(query, 'error_description') || callbackError,
      }
    }

    const code = getQueryValue(query, 'code')
    const state = getQueryValue(query, 'state')
    const storedState = getStoredState()

    if (storedState && state && storedState !== state) {
      return {
        success: false,
        error: 'OAuth state 校验失败',
      }
    }

    if (!code) {
      return {
        success: false,
        error: '缺少 OAuth code',
      }
    }

    try {
      const redirectUri = getQueryValue(query, 'redirect_uri') || getStoredRedirectUri()
      const { redirectUrl } = await completeOAuthLogin(code, redirectUri, state)

      return {
        success: true,
        redirectUrl,
      }
    }
    catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '登录失败',
      }
    }
  }

  /** 刷新用户信息（如积分变动后调用） */
  async function refreshUserInfo() {
    try {
      const info = await getUserInfo()
      userStore.setUserInfo(info)
    }
    catch {
      // 静默失败
    }
  }

  function setMockLogin(info: Partial<UserInfo> = {}) {
    userStore.setToken('mock-token-xyz')
    userStore.setUserInfo({
      id: 999,
      nickname: '测试用户',
      avatar: '/static/logo.png',
      points: 1280,
      isAdmin: false,
      ...info,
    })
  }

  return {
    ensureLogin,
    startOAuthLogin,
    completeOAuthLogin,
    handleOAuthCallback,
    getPendingOAuthReturnUrl: getStoredReturnUrl,
    clearOAuthLoginState,
    refreshUserInfo,
    setMockLogin,
  }
}

function confirmLogin() {
  return new Promise<boolean>((resolve) => {
    uni.showModal({
      title: '需要登录',
      content: '该操作需要登录，是否立即前往登录？',
      cancelText: '取消',
      confirmText: '去登录',
      confirmColor: BRAND_PRIMARY_COLOR,
      success: res => resolve(Boolean(res.confirm)),
      fail: () => resolve(false),
    })
  })
}

function getStoredRedirectUri() {
  return uni.getStorageSync(StorageKey.OAuthRedirectUri) || getOAuthRedirectUri(getCurrentReturnUrl())
}

function getStoredState() {
  return uni.getStorageSync(StorageKey.OAuthState) || ''
}

function getStoredReturnUrl() {
  const value
    = uni.getStorageSync(StorageKey.OAuthReturnUrl)
      || uni.getStorageSync(StorageKey.OAuthRedirectUrl)

  if (!value) {
    return '/'
  }

  if (typeof value === 'string') {
    return value
  }

  if (
    typeof value === 'object'
    && typeof value.url === 'string'
    && typeof value.createdAt === 'number'
    && Date.now() - value.createdAt <= oauthRedirectTtl
  ) {
    return value.url
  }

  return '/'
}

function setStoredReturnUrl(url: string) {
  const value = {
    url,
    createdAt: Date.now(),
  }

  uni.setStorageSync(StorageKey.OAuthReturnUrl, value)
  uni.setStorageSync(StorageKey.OAuthRedirectUrl, value)
}

function clearOAuthLoginState() {
  uni.removeStorageSync(StorageKey.OAuthRedirectUri)
  uni.removeStorageSync(StorageKey.OAuthReturnUrl)
  uni.removeStorageSync(StorageKey.OAuthState)
  uni.removeStorageSync(StorageKey.OAuthRedirectUrl)
}

function getOAuthRedirectUri(fallbackUrl: string) {
  const configuredRedirectUri = import.meta.env.VITE_OAUTH_REDIRECT_URI

  return configuredRedirectUri || fallbackUrl
}

function getCurrentReturnUrl() {
  // #ifdef H5
  return window.location.href
  // #endif

  // #ifndef H5
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as
    | { route?: string, options?: Record<string, unknown> }
    | undefined
  const currentRoute = currentPage?.route
  const route = currentRoute ? `/${currentRoute}` : '/'
  const options = currentPage?.options ?? {}
  const query = Object.entries(options)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')

  return query ? `${route}?${query}` : route
  // #endif
}

function redirectToOAuthProvider(loginUrl: string) {
  // #ifdef H5
  window.location.href = loginUrl
  return
  // #endif

  // #ifndef H5
  uni.showModal({
    title: '统一认证登录',
    content: '当前端需要配置 OAuth WebView 承载页后才能在小程序内跳转统一认证。',
    showCancel: false,
  })
  // #endif
}

function goMockLoginPage() {
  uni.switchTab({
    url: AppRoute.My,
    fail: () => {
      uni.reLaunch({ url: AppRoute.My })
    },
  })
}

function isOAuthRedirectCircuitOpen() {
  const now = Date.now()
  const attempts = readOAuthRedirectAttempts().filter(time => now - time <= oauthRedirectWindow)

  uni.setStorageSync(StorageKey.OAuthRedirectAttempts, attempts)

  return attempts.length >= oauthRedirectLimit
}

function recordOAuthRedirectAttempt() {
  const now = Date.now()
  const attempts = readOAuthRedirectAttempts().filter(time => now - time <= oauthRedirectWindow)

  uni.setStorageSync(StorageKey.OAuthRedirectAttempts, [...attempts, now])
}

function readOAuthRedirectAttempts() {
  const value = uni.getStorageSync(StorageKey.OAuthRedirectAttempts)

  return Array.isArray(value) ? value.filter((item): item is number => typeof item === 'number') : []
}

function showOAuthRecoveryModal() {
  uni.showModal({
    title: '登录异常',
    content: '登录跳转过于频繁，可能存在过期登录缓存。是否自助修复并重启？',
    cancelText: '取消',
    confirmText: '修复',
    confirmColor: BRAND_PRIMARY_COLOR,
    success: (res) => {
      if (!res.confirm) {
        return
      }

      const userStore = useUserStore()

      userStore.logout()
      uni.removeStorageSync(StorageKey.OAuthRedirectAttempts)
      uni.reLaunch({ url: AppRoute.Home })
    },
  })
}

function createOAuthState() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function getQueryValue(query: OAuthCallbackQuery, key: string) {
  const value = query[key]

  if (value === undefined || value === null) {
    return ''
  }

  return String(value)
}
