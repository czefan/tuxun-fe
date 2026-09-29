import { storeToRefs } from 'pinia'
import { useAuth as useSessionAuth } from '@/composables/use-auth'
import { useAuthStore } from '@/store/auth'
import { useUserStore } from '../store/user'
import { getUserInfo, loginCallback, logout as logoutApi } from '../api'

// 同一 Pinia 会话的多个调用方共用操作序号，避免旧登录覆盖新登录。
const operations = new WeakMap<ReturnType<typeof useAuthStore>, number>()

export function useAuth() {
  const userStore = useUserStore()
  const { userInfo } = storeToRefs(userStore)
  const sessionAuth = useSessionAuth()

  function startOperation() {
    const auth = useAuthStore()
    const operation = (operations.get(auth) ?? 0) + 1
    operations.set(auth, operation)
    let version = auth.sessionVersion
    return {
      isCurrent: () => operations.get(auth) === operation && auth.sessionVersion === version,
      adoptSession: (sessionId: string) => {
        auth.setSessionId(sessionId)
        version = auth.sessionVersion
      },
    }
  }

  async function handleCallback(code: string, redirectUri: string) {
    const operation = startOperation()
    const assertCurrent = () => {
      if (!operation.isCurrent()) throw new Error('登录操作已失效，请重新登录')
    }
    try {
      const loginResult = await loginCallback(code, redirectUri)
      assertCurrent()
      if (loginResult.sessionId) operation.adoptSession(loginResult.sessionId)
      const fullInfo = await getUserInfo()
      assertCurrent()
      userStore.setUserInfo(fullInfo)
      return loginResult
    } catch (error) {
      // 资料未加载成功时清理本次临时 Session，不留下“已登录但无用户资料”的状态。
      if (operation.isCurrent()) userStore.logout()
      throw error
    }
  }

  async function logout(): Promise<{ serverCleared: boolean; superseded?: boolean }> {
    const operation = startOperation()
    let serverCleared = false
    let superseded = false
    try {
      await logoutApi()
      serverCleared = true
    } catch {
      // 服务端失败仍允许当前会话本地退出。
    } finally {
      superseded = !operation.isCurrent()
      if (!superseded) userStore.logout()
    }
    return superseded ? { serverCleared, superseded: true } : { serverCleared }
  }

  return {
    ...sessionAuth,
    userInfo,
    handleCallback,
    logout,
  }
}
