import { http } from 'msw'
import { db } from '../data/db'
import { created, ok } from '../response'

export const contentHandlers = [
  http.get('*/api/contents/:key', ({ params }) => {
    const key = String(params.key)
    const item = db.contents[key] || {
      key,
      content: '暂无相关文本说明',
      related_id: null,
      version: 1,
      updated_at: '2026-07-31T00:00:00+08:00',
    }
    return ok({
      ...item,
      related_id: item.related_id ?? null,
    })
  }),

  http.post('*/api/feedback', () => {
    return created(db.createFeedback())
  }),
]
