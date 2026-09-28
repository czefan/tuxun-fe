import { storeToRefs } from 'pinia'
import { useAuth as useSessionAuth } from '@/composables/use-auth'
import { useAuthStore } from '@/store/auth'
import { useUserStore } from '../store/user'
import { getUserInfo, loginCallback, logout as logoutApi } from '../api'

export function useAuth() {
  const userStore = useUserStore()
  const { userInfo } = storeToRefs(userStore)
  const sessionAuth = useSessionAuth()

  async function handleCallback(code: string, redirectUri: string) {
    const loginResult = await loginCallback(code, redirectUri)
    if (loginResult.sessionId) {
      useAuthStore().setSessionId(loginResult.sessionId)
    }
    const fullInfo = await getUserInfo()
    userStore.setUserInfo(fullInfo)
    return loginResult
  }

  async function logout(): Promise<{ serverCleared: boolean }> {
    let serverCleared = false
    try {
      await logoutApi()
      serverCleared = true
    } catch {
      // 服务端登出失败不阻断本地登出：本地状态必须清，否则用户会卡在登录态里
    } finally {
      userStore.logout()
    }
    return { serverCleared }
  }

  return {
    ...sessionAuth,
    userInfo,
    handleCallback,
    logout,
  }
}
