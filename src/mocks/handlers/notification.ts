import { http } from 'msw'
import { db } from '../data/db'
import { toBothMedia } from '../data/placeholder'
import { ok } from '../response'
import { paginateArray, parsePaginationParams } from '../utils'

export const notificationHandlers = [
  http.get('*/api/announcements', ({ request }) => {
    const { page, pageSize } = parsePaginationParams(request.url)
    const paginated = paginateArray(db.announcements, page, pageSize)
    return ok({
      total: db.announcements.length,
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
