import { request } from '@/service/request'
import type { AnnouncementListItem, InteractionMessage, Media, PageParams } from '@/service/contract/types'
import { clampPageParams, toImageVM } from '@/service/contract/types'
import type {
  AnnouncementDetailVM,
  AnnouncementQueryParams,
  AnnouncementVM,
  InteractionMessageVM,
  NotificationPageResult,
} from './types'

import { formatDate } from '@/utils/date'
import { normalizeRichText } from '@/utils/rich-text'

/** 系统通知列表 GET /announcements（权限：L1） */
export async function getAnnouncements(params?: AnnouncementQueryParams): Promise<NotificationPageResult<AnnouncementVM>> {
  const { page, page_size } = clampPageParams(params)
  const raw = await request<{
    total: number
    unread_count: number
    list: AnnouncementListItem[]
  }>({
    url: '/announcements',
    method: 'GET',
    query: {
      keyword: params?.keyword,
      page,
      page_size,
    },
  })

  const list = raw.list.map(item => ({
    id: item.id,
    title: item.title,
    // 摘要由后端生成（剥标签、去 [image]、按码点截 50 字），列表项契约里没有 content
    contentPreview: item.content_preview,
    isRead: item.is_read,
    createdAt: formatDate(item.created_at),
    rawCreatedAt: item.created_at,
  }))

  return {
    list,
    total: raw.total,
    unreadCount: raw.unread_count,
  }
}

/** 系统通知详情 GET /announcements/{id}（权限：L1，读取即已读） */
export async function getAnnouncementDetail(id: number): Promise<AnnouncementDetailVM> {
  // content 与内容位/公告弹窗一样是后端富文本，走 normalizeRichText
  // 保证长 URL/表格/大图不横向溢出（与弹窗渲染同一份内容时表现一致）
  const raw = await request<{
    id: number
    title: string
    content: string
    is_read: boolean
    created_at: string
    image: Media | null
    related_type: 'activity' | null
    related_id: number | null
  }>({
    url: `/announcements/${id}`,
    method: 'GET',
  })

  const image = raw.image ? toImageVM(raw.image) : null

  return {
    id: raw.id,
    title: raw.title,
    content: normalizeRichText(raw.content),
    isRead: raw.is_read,
    createdAt: formatDate(raw.created_at),
    image,
    relatedType: raw.related_type,
    relatedId: raw.related_id,
  }
}

/** 互动消息列表 GET /notifications（权限：L1） */
export async function getInteractions(params?: PageParams & { type?: ('like' | 'comment')[] }): Promise<NotificationPageResult<InteractionMessageVM>> {
  const { page, page_size } = clampPageParams(params)
  const raw = await request<{
    total: number
    unread_count: number
    list: InteractionMessage[]
  }>({
    url: '/notifications',
    method: 'GET',
    query: {
      type: params?.type,
      page,
      page_size,
    },
  })

  const list = raw.list.map(item => ({
    id: item.id,
    type: item.type,
    user: {
      id: item.user.id,
      nickname: item.user.nickname,
      avatar: item.user.avatar,
    },
    relatedType: item.related_type as 'photo' | 'solve' | 'comment',
    relatedId: item.related_id,
    photoId: item.photo_id,
    content: item.content,
    isRead: item.is_read,
    createdAt: formatDate(item.created_at),
    rawCreatedAt: item.created_at,
  }))

  return {
    list,
    total: raw.total,
    unreadCount: raw.unread_count,
  }
}

/** 标记单条互动消息已读 PUT /notifications/{id}/read（权限：L1） */
export function markInteractionRead(id: number): Promise<{ id: number, is_read: boolean }> {
  return request<{ id: number, is_read: boolean }>({
    url: `/notifications/${id}/read`,
    method: 'PUT',
  })
}

/** 标记全部互动消息已读 PUT /notifications/read-all（权限：L1） */
export function markAllInteractionsRead(): Promise<{ marked_count: number }> {
  return request<{ marked_count: number }>({
    url: '/notifications/read-all',
    method: 'PUT',
  })
}
