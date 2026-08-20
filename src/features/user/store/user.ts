import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { AuthCleanupStorageKeys, SearchHistoryKeyPrefix } from '@/constants'
import { queryClient } from '@/service/query/client'
import { useAuthStore } from '@/store/auth'
import { useAnswerRecordLikeStore, useQuestionLikeStore } from '@/store/question-like'
import type { UserInfo } from '../types'

export const useUserStore = defineStore(
  'user',
  () => {
    const authStore = useAuthStore()

    /* ---- State ---- */
    const userInfo = ref<UserInfo | null>(null)

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
      userInfo.value = info
      authStore.setUserId(info.id)
      authStore.setSession(true)
    }

    /** 退出登录 */
    function logout() {
      authStore.clearToken()
      authStore.setUserId(null)
      userInfo.value = null
      clearClientSessionState()
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
  useQuestionLikeStore().clearQuestionLiked()
  useAnswerRecordLikeStore().clearAnswerRecordLiked()
  queryClient.removeQueries()

  const keysToRemove: string[] = [...AuthCleanupStorageKeys]

  try {
    const { keys } = uni.getStorageInfoSync()
    keysToRemove.push(...keys.filter(key => key.startsWith(SearchHistoryKeyPrefix)))
  }
  catch {
    // 拿不到 storage 列表时跳过，不影响其余清理
  }

  keysToRemove.forEach((key) => {
    try {
      uni.removeStorageSync(key)
    }
    catch {
      // ignore storage cleanup failure
    }
  })
}
