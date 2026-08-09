import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { loginDirectly, requireLogin } from '@/service/auth/login'
import { useAuthStore } from '@/store/auth'
import { useUserStore } from '../store/user'
import { getUserInfo, loginByGuid, logout as logoutApi } from '../api'

export function useAuth() {
  const userStore = useUserStore()
  const { userInfo, token } = storeToRefs(userStore)

  const isLoggedIn = computed(() => Boolean(userStore.isLoggedIn()))

  async function handleCallback(guid: string) {
    const loginResult = await loginByGuid(guid)
    if (loginResult) {
      if (loginResult.sessionId) {
        useAuthStore().setSessionId(loginResult.sessionId)
      }
      const fullInfo = await getUserInfo()
      userStore.setUserInfo(fullInfo)
    }
    return loginResult
  }

  async function logout(): Promise<{ serverCleared: boolean }> {
    let serverCleared = false
    try {
      await logoutApi()
      serverCleared = true
    }
    catch {
      // 服务端登出失败不阻断本地登出：本地状态必须清，否则用户会卡在登录态里
    }
    finally {
      userStore.logout()
    }
    return { serverCleared }
  }

  /**
   * 判断目标用户 ID 是否为当前登录用户。
   *
   * 注意：业务域的 useAuth 读取 userStore.userInfo?.id 以拿到完整的用户实体；
   * 基础设施层的 useAuth 则读取 authStore.userId（避免基础设施反向依赖 features/user）。
   */
  function isMe(authorId?: number | null): boolean {
    if (!userStore.isLoggedIn() || !userStore.userInfo?.id || !authorId)
      return false
    return userStore.userInfo.id === authorId
  }

  return {
    isLoggedIn: () => isLoggedIn.value,
    isLoggedInRef: isLoggedIn,
    userInfo,
    token,
    isMe,
    requireLogin,
    loginDirectly,
    handleCallback,
    logout,
  }
}
