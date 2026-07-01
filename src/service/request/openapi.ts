import { request as coreRequest } from './index'
import type { OpenApiRequestOptions, OpenApiResponseData, RequestOptions } from './types'

export type ApiRequestMethod = RequestOptions['method']
export type { OpenApiRequestOptions, OpenApiResponseData } from './types'

export default function request<T = unknown>(
  url: string,
  options: OpenApiRequestOptions = {},
): Promise<OpenApiResponseData<T>> {
  const { params, query, headers, header, ...requestOptions } = options

  return coreRequest<OpenApiResponseData<T>>({
    url,
    ...requestOptions,
    query: params ?? query,
    header: headers ?? header,
  })
}
