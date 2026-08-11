import type { components, operations } from './schema'
import { getEnvBaseUrl } from '../request/env'

// 仅本文件内部使用的简写；对外一律用下面具名导出的契约类型
type S = components['schemas']
type O = operations

const DEFAULT_PAGE_SIZE = 10
const MAX_PAGE_SIZE = 20

/** 已经是完整 URL 的协议前缀或 data/blob 协议 */
const ABSOLUTE_URL_RE = /^(?:https?:|data:|blob:|\/\/)/i

export interface PageParams {
  page?: number
  page_size?: number
}

export interface PageResult<T> {
  list: T[]
  total: number
}

export function clampPageParams(params?: PageParams): { page: number, page_size: number } {
  const page = Math.max(1, params?.page || 1)
  const page_size = Math.min(Math.max(1, params?.page_size || DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE)
  return { page, page_size }
}

// 契约 Operations 强类型解包别名
export type UserInfoResponse = O['getUserInfo']['responses'][200]['content']['application/json']['resp']
export type PhotoUserDetail = O['getMyPhotoDetail']['responses'][200]['content']['application/json']['resp']
export type ExchangeRecord = O['listExchanges']['responses'][200]['content']['application/json']['resp']['list'][number]
export type ExchangeResult = O['claimExchange']['responses'][201]['content']['application/json']['resp']
export type SubmitAttemptResult = O['submitAttempt']['responses'][201]['content']['application/json']['resp']

// 契约 Schemas 基础类型
export type UserSummary = S['UserSummary']
export type LoginResult = S['LoginResult']
export type ActivityCard = S['ActivityCard']
export type Media = S['Media']
export type LikeResult = S['LikeResult']
export type AnnouncementListItem = S['AnnouncementListItem']
export type InteractionMessage = S['InteractionMessage']
export type GoodItem = S['GoodItem']
export type Location = S['Location']
export type ScoreLog = S['ScoreLog']

/** 通用图片 ViewModel（包含宽高预留及瀑布流计算支持） */
export interface ImageVM {
  /** 列表 / 卡片展示：thumb_url ?? origin_url */
  url: string
  /** 点开大图 / 预览：origin_url ?? thumb_url */
  originUrl: string
  width: number
  height: number
}

/**
 * 将图片 URL 规范化为可直接加载的完整地址。
 *
 * 契约约定 `origin_url` / `thumb_url` 为完整 URL，但后端有时返回本地相对路径
 * （如 `/uploads/photos/xxx.png`）。这里做一层防御：相对路径自动拼接服务端基础地址，
 * 已经是完整 URL、data: / blob: 则原样返回。
 */
function normalizeImageUrl(raw: string): string {
  if (!raw || ABSOLUTE_URL_RE.test(raw)) {
    return raw
  }
  const base = getEnvBaseUrl()
  // base 也为空时（如同源部署 + 未配置 VITE_SERVER_BASEURL），相对路径本身即可用
  if (!base) {
    return raw
  }
  return `${base}${raw.startsWith('/') ? '' : '/'}${raw}`
}

/**
 * 将契约 Media 转化为统一 ImageVM
 * 包含宽高防御：当 width 或 height 缺失、非正数时，统一安全降级到 4:3 占位比例（800x600）
 */
export function toImageVM(m?: Media | null): ImageVM {
  if (!m) {
    return { url: '', originUrl: '', width: 800, height: 600 }
  }
  const url = normalizeImageUrl(m.thumb_url ?? m.origin_url ?? '')
  const originUrl = normalizeImageUrl(m.origin_url ?? m.thumb_url ?? '')
  const w = Number(m.width)
  const h = Number(m.height)
  if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
    return { url, originUrl, width: w, height: h }
  }
  return { url, originUrl, width: 800, height: 600 }
}
