import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { UserInfo } from '@/types/business'

export const useUserStore = defineStore(
  'user',
  () => {
    /* ---- State ---- */
    const token = ref('')
    const userInfo = ref<UserInfo | null>(null)

    /* ---- Getters ---- */
    const isLoggedIn = () => !!token.value
    const isAdmin = () => userInfo.value?.isAdmin ?? false
    const userAvatar = computed(() => userInfo.value?.avatar || '/static/logo.png')

    /* ---- Actions ---- */

    /** 设置 Token */
    function setToken(newToken: string) {
      token.value = newToken
    }

    /** 设置用户信息 */
    function setUserInfo(info: UserInfo) {
      userInfo.value = info
    }

    /** 退出登录 */
    function logout() {
      token.value = ''
      userInfo.value = null
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
