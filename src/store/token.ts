import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useUserStore } from './user'

interface TokenInfoInput {
  token?: string
  accessToken?: string
}

export const useTokenStore = defineStore(
  'token',
  () => {
    const userStore = useUserStore()

    // 适配 updateNowTime 链式调用
    const updateNowTime = () => {
      return useTokenStore()
    }

    // 适配 validToken
    const validToken = computed(() => userStore.token)

    // 适配 hasLogin
    const hasLogin = computed(() => userStore.isLoggedIn())

    // 适配 logout
    const logout = async () => {
      userStore.logout()
    }

    // 适配 tokenInfo 结构，提供单/双 token 兼容字段
    const tokenInfo = computed(() => ({
      accessToken: userStore.token,
      token: userStore.token,
      accessExpiresIn: 0,
      refreshToken: '',
      refreshExpiresIn: 0,
    }))

    // 适配 setTokenInfo
    const setTokenInfo = (val: string | TokenInfoInput | null | undefined) => {
      if (typeof val === 'string') {
        userStore.setToken(val)
      }
      else if (typeof val?.token === 'string') {
        userStore.setToken(val.token)
      }
      else if (typeof val?.accessToken === 'string') {
        userStore.setToken(val.accessToken)
      }
    }

    // 适配 login/wxLogin 占位函数防止编译报错
    const login = async () => {
      console.warn('login action in tokenStore is deprecated')
    }
    const wxLogin = async () => {
      console.warn('wxLogin action in tokenStore is deprecated')
    }

    return {
      validToken,
      hasLogin,
      logout,
      tokenInfo,
      setTokenInfo,
      updateNowTime,
      login,
      wxLogin,
    }
  },
)
