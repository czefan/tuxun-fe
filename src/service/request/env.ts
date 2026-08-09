import { isMpWeixin } from '@uni-helper/uni-env'

/**
 * 契约基础路径。api.md 约定所有接口挂在 `/api` 下，
 * 集中在这里拼接，禁止各业务域自行拼路径。
 */
export const API_BASE_PATH = '/api'

/**
 * 后端服务源（协议 + 域名 + 端口），不含 `/api`。
 * 同源部署时为空串；小程序按 envVersion 区分。
 */
export function getEnvBaseUrl(): string {
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

  // 开发环境默认后端地址统一在 env/.env.dev 的 VITE_SERVER_BASEURL 里配置，
  // 不要在这里硬编码：运行时兜底与 build/env.ts 的告警逻辑会互相矛盾，
  // 且 test / mock 等其它 mode 也会被同一段兜底误伤。

  // 缺省必须是空串：拼接时 undefined 会变成字面量 "undefined/photos"
  return (baseUrl || '').replace(/\/+$/, '')
}

/** 接口请求前缀 = 服务源 + 契约基础路径 */
export function getApiBaseUrl(): string {
  return `${getEnvBaseUrl()}${API_BASE_PATH}`
}
