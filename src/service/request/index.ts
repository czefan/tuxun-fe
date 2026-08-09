import { isH5 } from '@uni-helper/uni-env'
import { API_BASE_PATH, getEnvBaseUrl } from './env'
import { ApiRequestError } from './error'
import { http } from './http'
import { upload } from './upload'
import type { RequestOptions, UploadFileOptions } from './types'

export { ApiRequestError } from './error'
export { upload }
export type { RequestOptions, UploadFileOptions } from './types'

/**
 * 补齐服务源地址与契约基础路径 `/api`。
 */
function buildFullUrl(url: string) {
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

/** 业务请求入口，统一适配底层 http 请求 */
export function request<T = unknown>(options: RequestOptions): Promise<T> {
  const { url, method = 'GET', data, query, header, auth, silentAuth, hideErrorToast } = options
  return http<T>({
    url: buildFullUrl(url),
    method,
    data,
    query,
    header,
    auth,
    silentAuth,
    hideErrorToast,
  })
}

/** 上传请求入口，适配 multipart 上传与 H5 原生 PUT */
export function uploadFile<T = unknown>(options: UploadFileOptions): Promise<T> {
  const { url, filePath, files, name = 'file', formData, hideErrorToast } = options

  if (!filePath && (!files || files.length === 0)) {
    return Promise.reject(new ApiRequestError('缺少上传文件路径'))
  }

  return upload<T>({
    url: buildFullUrl(url),
    filePath,
    files,
    name,
    formData,
    hideErrorToast,
  })
}
