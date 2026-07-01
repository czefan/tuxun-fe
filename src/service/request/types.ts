import type { QueryParams } from '@/utils/queryString'

export { ApiRequestError } from './error'

export type RequestMethod = NonNullable<UniApp.RequestOptions['method']>
export type RequestData = QueryParams

export interface RequestOptions {
  url: string
  method?: RequestMethod
  data?: UniApp.RequestOptions['data']
  query?: RequestData
  header?: UniApp.RequestOptions['header']
  /** 是否需要携带 Token，默认 true */
  auth?: boolean
  /** 出错时是否隐藏错误提示 */
  hideErrorToast?: boolean
}

export interface UploadFileOptions {
  url: string
  filePath: string
  name?: string
  formData?: RequestData
  header?: UniApp.UploadFileOption['header']
  /** 是否需要携带 Token，默认 true */
  auth?: boolean
  /** 出错时是否隐藏错误提示 */
  hideErrorToast?: boolean
}

export interface UploadResponsePayload<T> {
  code?: number
  data?: T
  msg?: string
  message?: string
}

export interface ApiResponseEnvelope<T = unknown> {
  code: number
  data: T
  msg?: string
  message?: string
  [key: string]: unknown
}

/**
 * 在 uniapp 的 RequestOptions 和 IUniUploadFileOptions 基础上，添加自定义参数
 */
export type CustomRequestOptions = UniApp.RequestOptions & {
  query?: RequestData
  /** 是否携带登录态，默认 true */
  auth?: boolean
  /** 出错时是否隐藏错误提示 */
  hideErrorToast?: boolean
} & IUniUploadFileOptions // 添加uni.uploadFile参数类型

/** 主要提供给 openapi-ts-request 生成的代码使用 */
export type OpenApiRequestOptions = Omit<RequestOptions, 'url' | 'query' | 'header'> & {
  params?: RequestData
  query?: RequestData
  headers?: UniApp.RequestOptions['header']
  header?: UniApp.RequestOptions['header']
}

export type OpenApiResponseData<T> = T extends ApiResponseEnvelope<infer Data> ? Data : T

export interface HttpRequestResult<T> {
  promise: Promise<T>
  requestTask: UniApp.RequestTask
}

// 通用响应格式（兼容 msg + message 字段）
export type IResponse<T = unknown> = ApiResponseEnvelope<T>
