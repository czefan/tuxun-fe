/**
 * App 根生命周期治理与底层安全防护。
 */
import { onHide, onShow } from '@dcloudio/uni-app'
import { focusManager } from '@tanstack/vue-query'
import { useUserStore } from '@/features/user/store/user'
import { getUserInfo } from '@/features/user/api'
import { useAuthStore } from '@/store/auth'
import { refreshNetworkStatus } from '@/service/query/client'

export function useAppLifecycle() {
  const userStore = useUserStore()
  const authStore = useAuthStore()
  let validation: { version: number; promise: Promise<void> } | undefined

  onShow(() => {
    refreshNetworkStatus()
    focusManager.setFocused(true)
    void validateStoredSession()
  })
  onHide(() => focusManager.setFocused(false))

  function validateStoredSession() {
    if (!userStore.isLoggedIn()) return
    const version = authStore.sessionVersion
    if (validation?.version === version) return validation.promise

    const promise = getUserInfo({ silentAuth: true })
      .then((info) => {
        if (authStore.sessionVersion === version) userStore.setUserInfo(info)
      })
      .catch((error: unknown) => {
        if (authStore.sessionVersion === version && isUnauthorizedSessionError(error)) {
          userStore.logout()
        }
      })
      .finally(() => {
        if (validation?.promise === promise) validation = undefined
      })
    validation = { version, promise }
    return promise
  }
}

function isUnauthorizedSessionError(error: unknown) {
  return (
    !!error &&
    typeof error === 'object' &&
    ((error as { statusCode?: number }).statusCode === 401 ||
      (error as { code?: number }).code === 6)
  )
}
