/**
 * App 根生命周期治理与底层安全防护。
 */
import { onLaunch, onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/features/user'
import { getUserInfo } from '@/features/user/api'

export function useAppLifecycle() {
  onLaunch(() => {
    ensureEnvironmentFingerprint()
    registerH5UnhandledRejectionFilter()
    void validateStoredSession()
  })

  onShow(() => {
    // 应用回到前台时可静默刷新用户信息
    void validateStoredSession()
  })
}

/** 修复在 H5 环境下未登录拦截吐出的全局 unhandledrejection */
function registerH5UnhandledRejectionFilter() {
  // #ifdef H5
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason
      if (isUnauthorizedSessionError(reason)) {
        event.preventDefault() // 过滤静默 401 报错弹框
      }
    })
  }
  // #endif
}

/** 清理与初始化设备/环境指纹信息 */
function ensureEnvironmentFingerprint() {
  try {
    const FINGERPRINT_KEY = 'tuxun_device_fingerprint'
    let fp = uni.getStorageSync(FINGERPRINT_KEY)
    if (!fp) {
      fp = `fp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      uni.setStorageSync(FINGERPRINT_KEY, fp)
    }
  }
  catch {
    // 忽略平台环境兼容异常
  }
}

async function validateStoredSession() {
  const userStore = useUserStore()

  if (!userStore.isLoggedIn()) {
    return
  }

  try {
    const info = await getUserInfo({ silentAuth: true })
    userStore.setUserInfo(info)
  }
  catch (error) {
    if (isUnauthorizedSessionError(error)) {
      userStore.logout()
    }
  }
}

function isUnauthorizedSessionError(error: unknown) {
  return (
    !!error
    && typeof error === 'object'
    && ((error as { statusCode?: number }).statusCode === 401 || (error as { code?: number }).code === 401)
  )
}
