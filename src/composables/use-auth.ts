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
   * 注意：基础设施层的 useAuth 优先读取 authStore.userId。
   * 业务域（features/user）的 useAuth 则读取 userStore.userInfo?.id。
   * 两者在登录成功后由 setUserId/setUserInfo 保持同步。
   */
  function isMe(authorId?: number | null): boolean {
    if (!authStore.isLoggedIn || !authStore.userId || !authorId)
      return false
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
