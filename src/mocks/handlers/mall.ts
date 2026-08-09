import { http } from 'msw'
import { db } from '../data/db'
import { toBothMedia, toThumbMedia } from '../data/placeholder'
import { created, ok } from '../response'
import { paginateArray, parsePaginationParams } from '../utils'

export const mallHandlers = [
  http.get('*/api/goods', ({ request }) => {
    const { page, pageSize } = parsePaginationParams(request.url)
    const paginated = paginateArray(db.goods, page, pageSize)
    return ok({
      total: db.goods.length,
      list: paginated.map(g => ({
        ...g,
        image: toBothMedia(g.image),
      })),
    })
  }),

  http.post('*/api/exchange', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { good_id?: number }
    const goodId = Number(body.good_id || 1)
    return created(db.createExchange(goodId))
  }),

  http.get('*/api/exchange', ({ request }) => {
    const { page, pageSize } = parsePaginationParams(request.url)
    const paginated = paginateArray(db.exchanges, page, pageSize)
    return ok({
      total: db.exchanges.length,
      list: paginated.map(e => ({
        ...e,
        good: {
          ...e.good,
          image: toThumbMedia(e.good.image),
        },
      })),
    })
  }),
]
