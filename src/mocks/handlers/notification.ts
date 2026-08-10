import { http } from 'msw'
import { db } from '../data/db'
import { toBothMedia } from '../data/placeholder'
import { ok } from '../response'
import { paginateArray, parsePaginationParams } from '../utils'

/**
 * 契约：keyword 搜索匹配剥离 HTML 标签后的完整正文文本——
 * 不搜 content_preview（截断版，50 字后内容无法命中），也不搜 HTML 源码（会命中 p/strong 等标签名）。
 */
function toPlainText(html: string): string {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export const notificationHandlers = [
  http.get('*/api/announcements', ({ request }) => {
    const { page, pageSize } = parsePaginationParams(request.url)
    // 契约：keyword 按标题或正文文字模糊搜索；unread_count 为未读总数，不受筛选影响
    const keyword = new URL(request.url).searchParams.get('keyword')?.trim().toLowerCase() || ''
    const list = db.announcements.filter((a) => {
      if (!keyword)
        return true
      return a.title.toLowerCase().includes(keyword) || toPlainText(a.content).toLowerCase().includes(keyword)
    })
    const paginated = paginateArray(list, page, pageSize)
    return ok({
      total: list.length,
      unread_count: db.announcements.filter(a => !a.is_read).length,
      list: paginated.map(a => ({
        id: a.id,
        title: a.title,
        content_preview: a.content_preview,
        is_read: a.is_read,
        created_at: a.created_at,
      })),
    })
  }),

  http.get('*/api/announcements/:id', ({ params }) => {
    const id = Number(params.id)
    const item = db.announcements.find(a => a.id === id) || db.announcements[0]
    return ok({
      id: item.id,
      title: item.title,
      content: item.content,
      is_read: true,
      created_at: item.created_at,
      image: item.image ? toBothMedia(item.image) : null,
      related_type: item.related_type,
      related_id: item.related_id,
    })
  }),

  http.get('*/api/notifications', ({ request }) => {
    const { page, pageSize } = parsePaginationParams(request.url)
    const paginated = paginateArray(db.notifications, page, pageSize)
    return ok({
      total: db.notifications.length,
      unread_count: db.notifications.filter(n => !n.is_read).length,
      list: paginated,
    })
  }),

  http.put('*/api/notifications/:id/read', ({ params }) => {
    const id = Number(params.id)
    const item = db.notifications.find(n => n.id === id)
    if (item) {
      item.is_read = true
    }
    return ok({ id, is_read: true })
  }),

  http.put('*/api/notifications/read-all', () => {
    db.notifications.forEach(n => (n.is_read = true))
    return ok({ marked_count: db.notifications.length })
  }),
]
