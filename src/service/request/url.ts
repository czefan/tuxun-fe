import { isH5 } from '@uni-helper/uni-env'
import { API_BASE_PATH, getEnvBaseUrl } from './env'

/**
 * 补齐服务源地址与契约基础路径 `/api`。
 */
export function buildFullUrl(url: string): string {
  if (url.startsWith('http')) {
    return url
  }
  const apiPath = url.startsWith(`${API_BASE_PATH}/`) || url === API_BASE_PATH
    ? url
    : `${API_BASE_PATH}${url.startsWith('/') ? '' : '/'}${url}`

  const isMock = import.meta.env.VITE_ENABLE_MOCK === 'true'
  const isProxyEnabled = !isMock && import.meta.env.VITE_APP_PROXY_ENABLE === 'true'

  if (isH5 && isProxyEnabled && import.meta.env.VITE_APP_PROXY_PREFIX) {
    return `${import.meta.env.VITE_APP_PROXY_PREFIX}${apiPath}`
  }

  const baseUrl = getEnvBaseUrl()
  return `${baseUrl}${apiPath}`
}
