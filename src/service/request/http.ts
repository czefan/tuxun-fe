import { updateServerTimeOffset } from '@/utils/server-time'
import { ApiRequestError } from './error'
import { handleResponseError, showToastDeduplicated } from './error-code'
import type { ContractResponse } from './error-code'
import type { CustomRequestOptions } from './types'

export async function http<T>(options: CustomRequestOptions) {
  if (import.meta.env.VITE_ENABLE_MOCK === 'true') {
    // 等 msw 的 Service Worker 接管页面再发请求，否则首屏会透传到真实网络拿 404
    const { ensureMockReady } = await import('@/mocks')
    await ensureMockReady()
  }

  return new Promise<T>((resolve, reject) => {
    uni.request({
      ...options,
      dataType: 'json',
      // #ifndef MP-WEIXIN
      responseType: 'json',
      // #endif
      // 响应成功
      success: (res) => {
        // 读取响应头中的 Date，兼容不同平台大小写
        const headers = res.header || {}
        const dateHeader = headers.Date || headers.date
        updateServerTimeOffset(dateHeader)

        let responseData = res.data as Partial<ContractResponse<T>> | string | undefined
        if (typeof responseData === 'string') {
          try {
            responseData = JSON.parse(responseData)
          }
          catch {
            responseData = {}
          }
        }
        const dataObj = (responseData || {}) as Partial<ContractResponse<T>>
        const statusCode = res.statusCode

        const isSuccess = dataObj.success === true && dataObj.code === 0 && statusCode >= 200 && statusCode < 300

        if (isSuccess) {
          return resolve(dataObj.resp as T)
        }

        const { message, code } = handleResponseError(
          statusCode,
          dataObj,
          options.hideErrorToast,
          options.silentAuth,
        )

        return reject(
          new ApiRequestError(message, {
            code,
            statusCode,
            data: dataObj.resp,
            isSilent: options.silentAuth,
          }),
        )
      },
      // 响应失败（网络故障等）
      fail(err) {
        const message = '网络错误，换个网络试试'
        if (!options.hideErrorToast) {
          showToastDeduplicated(message)
        }
        reject(new ApiRequestError(message, { data: err }))
      },
    })
  })
}
