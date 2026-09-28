import { computed } from 'vue'
import { loginDirectly, requireLogin } from '@/service/auth/login'
import { useAuthStore } from '@/store/auth'

export function useAuth() {
  const authStore = useAuthStore()

  const isLoggedIn = computed(() => authStore.isLoggedIn)
  const currentUserId = computed(() => authStore.userId)

  /**
   * 判断目标用户 ID 是否为当前登录用户。
   *
   * 登录态与身份判断统一读取 authStore；业务域扩展此 composable 提供用户资料与登录回调。
   */
  function isMe(authorId?: number | null): boolean {
    if (!authStore.isLoggedIn || !authStore.userId || !authorId) return false
    return authStore.userId === authorId
  }

  return {
    isLoggedIn: () => isLoggedIn.value,
    isLoggedInRef: isLoggedIn,
    token: computed(() => authStore.token),
    currentUserId,
    isMe,
    requireLogin,
    loginDirectly,
  }
}
