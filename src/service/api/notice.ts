/**
 * 通知相关接口（消息列表、详情、已读状态）
 */
import { request } from '../request'
import { ApiEndpoint } from './endpoints'
import type { PageParams, PageResult } from './types'

export type NoticeType = 'system' | 'activity' | 'review' | 'points'
export type NoticeReadStatus = 'all' | 'read' | 'unread'

export interface NoticeListParams extends PageParams {
  type?: NoticeType | 'all'
  readStatus?: NoticeReadStatus
  keyword?: string
}

export interface NoticeDto {
  id: number
  title: string
  summary: string
  type: NoticeType
  isRead: boolean
  createdAt: string
}

export interface NoticeDetailDto extends NoticeDto {
  content: string
}

export interface NoticeUnreadCountDto {
  total: number
  byType?: Partial<Record<NoticeType, number>>
}

/** 获取通知列表 */
export function getNotices(params: NoticeListParams) {
  return request<PageResult<NoticeDto>>({
    url: ApiEndpoint.notice.list,
    data: params as unknown as Record<string, unknown>,
  })
}

/** 获取通知详情 */
export function getNoticeDetail(noticeId: number) {
  return request<NoticeDetailDto>({
    url: ApiEndpoint.notice.detail(noticeId),
  })
}

/** 获取未读通知数量 */
export function getNoticeUnreadCount() {
  return request<NoticeUnreadCountDto>({
    url: ApiEndpoint.notice.unreadCount,
  })
}

/** 标记单条通知已读 */
export function markNoticeRead(noticeId: number) {
  return request<void>({
    url: ApiEndpoint.notice.markRead(noticeId),
    method: 'POST',
  })
}

/** 标记全部通知已读 */
export function markAllNoticesRead(type?: NoticeType) {
  return request<void>({
    url: ApiEndpoint.notice.markAllRead,
    method: 'POST',
    data: type ? { type } : undefined,
  })
}
