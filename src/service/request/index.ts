import { http } from './http'
import { ApiRequestError } from './error'
import { handleUnauthorized } from './shared'
import { ResultEnum } from './http-status'
import type { RequestOptions, UploadFileOptions, UploadResponsePayload } from './types'

export { ApiRequestError }
export type { RequestData, RequestMethod, RequestOptions, UploadFileOptions } from './types'

/** 业务请求入口，统一适配底层 http 请求 */
export function request<T = unknown>(options: RequestOptions): Promise<T> {
  const { url, method = 'GET', data, query, header, auth, hideErrorToast } = options
  return http<T>({
    url,
    method,
    data,
    query,
    header,
    auth,
    hideErrorToast,
  })
}

/** 上传请求入口，统一适配 uni.uploadFile 和全局拦截器 */
export function uploadFile<T = unknown>(options: UploadFileOptions): Promise<T> {
  const { url, filePath, name = 'file', formData, header, auth, hideErrorToast } = options

  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url,
      filePath,
      name,
      formData,
      header,
      auth,
      hideErrorToast,
      success: (res) => {
        const data = parseUploadData(res.data)

        const payload = isUploadResponsePayload<T>(data) ? data : undefined
        const code = payload?.code

        if (res.statusCode === ResultEnum.Unauthorized || code === ResultEnum.Unauthorized) {
          handleUnauthorized()
          reject(new ApiRequestError('未登录', { statusCode: 401 }))
          return
        }

        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (code === undefined) {
            resolve(data as T)
          }
          else if (isSuccessCode(code)) {
            resolve(payload?.data as T)
          }
          else {
            const msg = payload?.msg || payload?.message || '上传失败'
            showErrorToast(msg, hideErrorToast)
            reject(new ApiRequestError(msg, { code: payload?.code, data }))
          }
        }
        else {
          const msg = payload?.msg || payload?.message || '上传失败'
          showErrorToast(msg, hideErrorToast)
          reject(new ApiRequestError(msg, { statusCode: res.statusCode, data }))
        }
      },
      fail: (err) => {
        const msg = '网络错误，换个网络试试'
        showErrorToast(msg, hideErrorToast)
        reject(new ApiRequestError(msg, { data: err }))
      },
    })
  })
}

function isUploadResponsePayload<T>(value: unknown): value is UploadResponsePayload<T> {
  return typeof value === 'object' && value !== null
}

function parseUploadData(data: unknown) {
  if (typeof data !== 'string' || !data) {
    return data
  }

  try {
    return JSON.parse(data) as unknown
  }
  catch {
    return data
  }
}

function isSuccessCode(code: number) {
  return code === ResultEnum.Success0 || code === ResultEnum.Success200
}

function showErrorToast(message: string, hideErrorToast?: boolean) {
  if (hideErrorToast) {
    return
  }

  uni.showToast({
    icon: 'none',
    title: message,
  })
}
