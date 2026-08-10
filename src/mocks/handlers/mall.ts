import { http } from 'msw'
import { db } from '../data/db'
import { toBothMedia, toThumbMedia } from '../data/placeholder'
import { created, ok } from '../response'
import { paginateArray, parsePaginationParams } from '../utils'

export const mallHandlers = [
  http.get('*/api/goods', ({ request }) => {
    const { page, pageSize } = parsePaginationParams(request.url)
    // 契约：keyword 按名称或描述文字模糊搜索（最长 50）
    const keyword = new URL(request.url).searchParams.get('keyword')?.trim().toLowerCase() || ''
    const list = db.goods.filter((g) => {
      if (!keyword)
        return true
      return g.name.toLowerCase().includes(keyword) || g.description.toLowerCase().includes(keyword)
    })
    const paginated = paginateArray(list, page, pageSize)
    return ok({
      total: list.length,
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
