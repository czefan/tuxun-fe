import { request as coreRequest } from './index'
import type { OpenApiRequestOptions } from './types'

/*
 * openapi-ts-request 工具的 request 跨客户端适配方法
 */
export default function request<T extends { data?: any }>(
  url: string,
  options: OpenApiRequestOptions & {
    params?: Record<string, unknown>
    headers?: Record<string, unknown>
  },
) {
  const { params, headers, header, ...requestOptions } = options

  return coreRequest<T['data']>({
    url,
    ...requestOptions,
    query: params,
    header: headers || header,
  })
}
