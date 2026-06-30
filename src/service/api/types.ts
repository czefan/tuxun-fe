/** 分页请求参数 */
export interface PageParams {
  page: number
  pageSize: number
}

/** 分页返回结构 */
export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}
