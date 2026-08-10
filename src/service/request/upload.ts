import { buildFullUrl } from './url'
import { ApiRequestError } from './error'
import { handleResponseError, showToastDeduplicated } from './error-code'

export interface UploadOptions {
  url: string
  filePath?: string
  files?: Array<{ name?: string, uri?: string }>
  name?: string
  header?: Record<string, string>
  formData?: Record<string, unknown>
  method?: 'POST' | 'PUT'
  hideErrorToast?: boolean
}

/**
 * 客户端文件上传统一封装 (multipart/form-data)
 *
 * 小程序与 H5 统一使用 POST + X-HTTP-Method-Override: PUT 重写传输，
 * 避免原生 XHR 旁路绕过 uni.addInterceptor('uploadFile')。
 */
export function upload<T>(options: UploadOptions): Promise<T> {
  const { url, filePath, files, name = 'file', header, formData, method = 'POST', hideErrorToast } = options

  if (!filePath && (!files || files.length === 0)) {
    return Promise.reject(new ApiRequestError('缺少上传文件路径'))
  }

  const fullUrl = buildFullUrl(url)

  const headers: Record<string, string> = { ...header }
  if (method === 'PUT') {
    headers['X-HTTP-Method-Override'] = 'PUT'
  }

  // 标准 uni.uploadFile 请求
  return new Promise<T>((resolve, reject) => {
    const uploadOptions: UniApp.UploadFileOption = {
      url: fullUrl,
      header: headers,
      formData,
      success: (res) => {
        let data: unknown = res.data
        if (typeof res.data === 'string') {
          try {
            data = JSON.parse(res.data)
          }
          catch {
            // raw string
          }
        }

        const statusCode = res.statusCode
        if (statusCode >= 200 && statusCode < 300) {
          const resObj = data as Record<string, any>
          if (resObj && typeof resObj === 'object') {
            const code = resObj.code

            // 契约或旧逻辑成功校验
            if (resObj.success === false || (code !== undefined && code !== 0)) {
              const { message, code: errCode } = handleResponseError(statusCode, resObj, hideErrorToast)
              return reject(new ApiRequestError(message, { code: errCode, statusCode, data }))
            }

            if (resObj.resp !== undefined)
              return resolve(resObj.resp as T)
            if (resObj.data !== undefined)
              return resolve(resObj.data as T)
            return resolve(data as T)
          }
          return resolve(data as T)
        }

        const { message, code } = handleResponseError(statusCode, data as any, hideErrorToast)
        reject(new ApiRequestError(message, { code, statusCode, data }))
      },
      fail: (err) => {
        const message = '文件上传失败，请稍后再试'
        if (!hideErrorToast)
          showToastDeduplicated(message)
        reject(new ApiRequestError(message, { data: err }))
      },
    }

    if (files && files.length > 0) {
      uploadOptions.files = files
    }
    else {
      uploadOptions.filePath = filePath
      uploadOptions.name = name
    }

    uni.uploadFile(uploadOptions)
  })
}
