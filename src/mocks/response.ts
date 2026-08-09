import { HttpResponse } from 'msw'

/**
 * Mock 响应工厂（对齐 tuxun-admin-fe 的 `mocks/response.ts`）。
 *
 * 错误码严格对齐 api.md 的码表，不可自行编号——前端 `service/request/error-code.ts`
 * 正是按 code 分流的（6 走登录引导、7 提示权限、5 提示业务规则），
 * 码位错了会让联调前的错误分支验证完全失真。
 *
 * | code | 语义 | HTTP |
 * | ---- | ---- | ---- |
 * | 3 | 参数错误 | 400 |
 * | 4 | 系统错误 | 500 |
 * | 5 | 操作错误（业务规则 / 资源不存在） | 400 / 404 |
 * | 6 | 鉴权错误（未登录） | 401 |
 * | 7 | 权限错误 | 403 |
 * | 8 | 冲突错误 | 409 |
 * | 9 | 频率限制 | 429 |
 */

interface ApiResponseEnvelope<T = unknown> {
  success: boolean
  resp: T
  message: string
  code: number
}

export function ok<T>(resp: T): HttpResponse<any> {
  return HttpResponse.json<ApiResponseEnvelope<T>>({
    success: true,
    message: '',
    code: 0,
    resp,
  }) as HttpResponse<any>
}

/** 契约中写操作（投稿 / 作答 / 评论 / 兑换 / 反馈）统一返回 201 */
export function created<T>(resp: T): HttpResponse<any> {
  return HttpResponse.json<ApiResponseEnvelope<T>>({
    success: true,
    message: '',
    code: 0,
    resp,
  }, { status: 201 }) as HttpResponse<any>
}

function fail(message: string, code: number, status: number): HttpResponse<any> {
  return HttpResponse.json<ApiResponseEnvelope<null>>({
    success: false,
    message,
    code,
    resp: null,
  }, { status }) as HttpResponse<any>
}

/** code=3 请求参数不合法 */
export const badRequest = (message = '参数错误: 请求参数不合法') => fail(message, 3, 400)
/** code=4 服务器内部错误 */
export const serverError = (message = '系统错误: 服务器内部错误') => fail(message, 4, 500)
/** code=5 业务规则不满足（库存 / 积分 / 活动状态 / 次数上限） */
export const operationError = (message = '操作错误: 业务规则不满足') => fail(message, 5, 400)
/** code=5 + 404：路径 {id} 定位的资源不存在 */
export const notFound = (message = '操作错误: 资源不存在') => fail(message, 5, 404)
/** code=6 未登录 */
export const unauthorized = (message = '鉴权错误: 未登录') => fail(message, 6, 401)
/** code=7 权限不足 */
export const forbidden = (message = '权限错误: 权限不足') => fail(message, 7, 403)
/** code=8 重复操作 / 幂等键冲突 / 并发冲突 */
export const conflict = (message = '冲突错误: 重复操作') => fail(message, 8, 409)
/** code=9 超出修改次数 / 频率限制 */
export const rateLimited = (message = '频率限制: 超出本月修改次数') => fail(message, 9, 429)

/** 错误码工厂与契约码表的映射，供契约守卫静态校验 */
export const ERROR_CODE_MATRIX = [
  { name: 'badRequest', code: 3, status: 400 },
  { name: 'serverError', code: 4, status: 500 },
  { name: 'operationError', code: 5, status: 400 },
  { name: 'notFound', code: 5, status: 404 },
  { name: 'unauthorized', code: 6, status: 401 },
  { name: 'forbidden', code: 7, status: 403 },
  { name: 'conflict', code: 8, status: 409 },
  { name: 'rateLimited', code: 9, status: 429 },
] as const
