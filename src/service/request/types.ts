import type { QueryParams } from '@/utils/query-string'

type RequestMethod = NonNullable<UniApp.RequestOptions['method']>
type RequestData = QueryParams

export interface RequestOptions {
  url: string
  method?: RequestMethod
  data?: UniApp.RequestOptions['data']
  query?: RequestData
  header?: UniApp.RequestOptions['header']
  /** 是否需要携带 Token，默认 true */
  auth?: boolean
  /** 401 时是否静默处理，不自动跳登录页 */
  silentAuth?: boolean
  /** 出错时是否隐藏错误提示 */
  hideErrorToast?: boolean
}

/**
 * 在 uniapp 的 RequestOptions 和 IUniUploadFileOptions 基础上，添加自定义参数
 */
export type CustomRequestOptions = UniApp.RequestOptions & {
  query?: RequestData
  /** 是否携带登录态，默认 true */
  auth?: boolean
  /** 401 时是否静默处理，不自动跳登录页 */
  silentAuth?: boolean
  /** 出错时是否隐藏错误提示 */
  hideErrorToast?: boolean
} & IUniUploadFileOptions
