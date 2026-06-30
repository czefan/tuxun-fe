import { isMpWeixin } from '@uni-helper/uni-env'

/**
 * 根据微信小程序当前环境，判断应该获取的 baseUrl。
 */
export function getEnvBaseUrl() {
  let baseUrl = import.meta.env.VITE_SERVER_BASEURL

  if (isMpWeixin) {
    const {
      miniProgram: { envVersion },
    } = uni.getAccountInfoSync()

    switch (envVersion) {
      case 'develop':
        baseUrl = import.meta.env.VITE_SERVER_BASEURL__WEIXIN_DEVELOP || baseUrl
        break
      case 'trial':
        baseUrl = import.meta.env.VITE_SERVER_BASEURL__WEIXIN_TRIAL || baseUrl
        break
      case 'release':
        baseUrl = import.meta.env.VITE_SERVER_BASEURL__WEIXIN_RELEASE || baseUrl
        break
    }
  }

  return baseUrl
}

export const isDoubleTokenMode = import.meta.env.VITE_AUTH_MODE === 'double'
