import type { CustomRequestOptions, IResponse } from './types'
import { handleUnauthorized } from './shared'
import { ResultEnum } from './tools/enum'
import { ApiRequestError } from './types'

export function http<T>(options: CustomRequestOptions) {
  return new Promise<T>((resolve, reject) => {
    uni.request({
      ...options,
      dataType: 'json',
      // #ifndef MP-WEIXIN
      responseType: 'json',
      // #endif
      // 响应成功
      success: async (res) => {
        const responseData = res.data as IResponse<T>
        const { code } = responseData

        // 检查是否是401错误（包括HTTP状态码401或业务码401）
        const isTokenExpired = res.statusCode === 401 || code === 401

        if (isTokenExpired) {
          handleUnauthorized()
          return reject(new ApiRequestError('未登录', { code, statusCode: res.statusCode, data: res.data }))
        }

        // 处理其他成功状态（HTTP状态码200-299）
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // 处理业务逻辑错误
          if (code !== ResultEnum.Success0 && code !== ResultEnum.Success200) {
            const message = responseData.msg || responseData.message || '请求错误'
            showErrorToast(message, options.hideErrorToast)
            return reject(new ApiRequestError(message, { code, statusCode: res.statusCode, data: responseData.data }))
          }
          return resolve(responseData.data)
        }

        // 处理其他错误
        const message = (res.data as any).msg || (res.data as any).message || '请求错误'
        showErrorToast(message, options.hideErrorToast)
        reject(new ApiRequestError(message, { code, statusCode: res.statusCode, data: res.data }))
      },
      // 响应失败
      fail(err) {
        const message = '网络错误，换个网络试试'
        showErrorToast(message, options.hideErrorToast)
        reject(new ApiRequestError(message, { data: err }))
      },
    })
  })
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
