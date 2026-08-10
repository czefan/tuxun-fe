import { buildFullUrl } from './url'
import { http } from './http'
import { upload } from './upload'
import type { RequestOptions } from './types'

export { ApiRequestError } from './error'
// buildFullUrl 定义在 ./url（upload.ts 也从那里引入，避免循环依赖），不在此 re-export
export { upload, upload as uploadFile }
export type { RequestOptions } from './types'

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
