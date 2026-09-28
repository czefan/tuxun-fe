import { defineStore } from 'pinia'
import { computed, nextTick, ref, watch } from 'vue'
import { AuthCleanupStorageKeys, SubmitDraftKeyPrefix } from '@/constants'
import { queryClient } from '@/service/query/client'
import { useAuthStore } from '@/store/auth'
import type { UserInfo } from '../types'

export const useUserStore = defineStore(
  'user',
  () => {
    const authStore = useAuthStore()

    /* ---- State ---- */
    const userInfo = ref<UserInfo | null>(null)

    // 手动登出和请求层的 401/封禁都经过同一条清理路径。
    watch(
      () => [authStore.isLoggedIn, authStore.userId] as const,
      ([loggedIn, id], [wasLoggedIn, previousId]) => {
        if (
          (wasLoggedIn && !loggedIn) ||
          (previousId !== null && id !== null && previousId !== id)
        ) {
          userInfo.value = null
          clearClientSessionState()
        }
      },
      { flush: 'sync' },
    )

    /* ---- Getters ---- */
    const token = computed(() => authStore.token)
    // 登录态的事实源在 authStore，这里只做转发，避免两处判断不一致
    const isLoggedIn = () => authStore.isLoggedIn
    const isAdmin = () => (userInfo.value?.level ?? 0) >= 2
    const userAvatar = computed(() => userInfo.value?.avatar || '/static/images/default-avatar.png')

    /* ---- Actions ---- */

    /** 设置 Token */
    function setToken(newToken: string) {
      authStore.setToken(newToken)
    }

    /** 设置用户信息。cookie 会话下没有 token，拿到个人信息即视为已登录 */
    function setUserInfo(info: UserInfo) {
      authStore.setUserId(info.id)
      authStore.setSession(true)
      userInfo.value = info
    }

    /** 退出登录 */
    function logout() {
      const wasLoggedIn = authStore.isLoggedIn
      authStore.clearToken()
      userInfo.value = null
      if (!wasLoggedIn) clearClientSessionState()
    }

    /** 局部更新用户信息 */
    function updateUserInfo(fields: Partial<UserInfo>) {
      if (userInfo.value) {
        userInfo.value = { ...userInfo.value, ...fields }
      }
    }

    return {
      token,
      userInfo,
      isLoggedIn,
      isAdmin,
      userAvatar,
      setToken,
      setUserInfo,
      logout,
      updateUserInfo,
    }
  },
  {
    persist: true,
  },
)

function clearClientSessionState() {
  // removeQueries 会销毁仍被页面订阅的查询，导致列表停在加载态直至手动刷新。
  // 先取消旧请求，等登录态 / enabled / queryKey 更新后重置并重拉活跃查询。
  void queryClient.cancelQueries()
  void nextTick().then(() => queryClient.resetQueries())

  const keysToRemove: string[] = [...AuthCleanupStorageKeys]

  try {
    const { keys } = uni.getStorageInfoSync()
    keysToRemove.push(...keys.filter((key) => key.startsWith(SubmitDraftKeyPrefix)))
  } catch {
    // 拿不到 storage 列表时跳过，不影响其余清理
  }

  keysToRemove.forEach((key) => {
    try {
      uni.removeStorageSync(key)
    } catch {
      // ignore storage cleanup failure
    }
  })
}
