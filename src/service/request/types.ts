export class ApiRequestError extends Error {
  code?: number
  statusCode?: number
  data?: unknown
  isSilent?: boolean

  constructor(
    message: string,
    options: { code?: number, statusCode?: number, data?: unknown, isSilent?: boolean } = {},
  ) {
    super(message)
    this.name = 'ApiRequestError'
    this.code = options.code
    this.statusCode = options.statusCode
    this.data = options.data
    this.isSilent = options.isSilent
  }
}

export type RequestMethod = NonNullable<UniApp.RequestOptions['method']>
export type RequestData = Record<string, unknown>

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
export type OpenApiRequestOptions = Omit<CustomRequestOptions, 'url'>

export interface HttpRequestResult<T> {
  promise: Promise<T>
  requestTask: UniApp.RequestTask
}

// 通用响应格式（兼容 msg + message 字段）
export type IResponse<T = any> = {
  code: number
  data: T
  message: string
  [key: string]: any // 允许额外属性
} | {
  code: number
  data: T
  msg: string
  [key: string]: any // 允许额外属性
}
