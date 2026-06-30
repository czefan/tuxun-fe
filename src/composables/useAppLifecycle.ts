/**
 * App 根生命周期治理。
 * 这里只注册跨页面、跨平台的全局启动逻辑，避免 App.vue 展开具体实现。
 */
import { onLaunch, onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { isMockLoginEnabled } from '@/composables/useAuth'
import { StorageKey } from '@/constants'
import { AppRoute } from '@/router/routes'

const pendingActionTtl = 5 * 60 * 1000

export function useAppLifecycle() {
  onLaunch(() => {
    ensureEnvironmentFingerprint()
    collectExpiredPendingActions()
    bindSilentAuthErrorFilter()
  })

  onShow(() => {
    collectExpiredPendingActions()
  })
}

function ensureEnvironmentFingerprint() {
  const fingerprint = [
    import.meta.env.MODE,
    `mock:${isMockLoginEnabled ? '1' : '0'}`,
    `api:${import.meta.env.VITE_API_BASE_URL || ''}`,
    `oauth:${import.meta.env.VITE_OAUTH_REDIRECT_URI || ''}`,
  ].join('|')
  const cachedFingerprint = uni.getStorageSync(StorageKey.EnvNamespaceFingerprint)

  if (!cachedFingerprint) {
    uni.setStorageSync(StorageKey.EnvNamespaceFingerprint, fingerprint)
    return
  }

  if (cachedFingerprint === fingerprint) {
    return
  }

  useUserStore().logout()
  uni.setStorageSync(StorageKey.EnvNamespaceFingerprint, fingerprint)
  uni.reLaunch({ url: AppRoute.Home })
}

function collectExpiredPendingActions() {
  const actions = uni.getStorageSync(StorageKey.PendingActions)

  if (!Array.isArray(actions)) {
    return
  }

  const now = Date.now()
  const hasExpiredAction = actions.some((action) => {
    return (
      action
      && typeof action === 'object'
      && typeof action.createdAt === 'number'
      && now - action.createdAt > pendingActionTtl
    )
  })

  if (hasExpiredAction) {
    uni.removeStorageSync(StorageKey.PendingActions)
  }
}

function bindSilentAuthErrorFilter() {
  // #ifdef H5
  window.addEventListener('unhandledrejection', (event) => {
    if (isSilentAuthError(event.reason)) {
      event.preventDefault()
    }
  })
  // #endif
}

function isSilentAuthError(error: unknown) {
  return (
    !!error
    && typeof error === 'object'
    && ((error as { isSilent?: boolean }).isSilent === true
      || ((error as { code?: number }).code === 401 && !(error as { message?: string }).message))
  )
}
