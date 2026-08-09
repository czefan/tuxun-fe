import { http } from 'msw'
import { db } from '../data/db'
import { toThumbMedia } from '../data/placeholder'
import { ok } from '../response'
import { serverNow } from '@/utils/server-time'

export const activityHandlers = [
  http.get('*/api/activity', ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const keyword = url.searchParams.get('keyword')
    const page = Number.parseInt(url.searchParams.get('page') || '1', 10)
    const pageSize = Number.parseInt(url.searchParams.get('page_size') || '20', 10)

    const now = serverNow()

    let filtered = db.activities.filter((a) => {
      const start = new Date(a.start_time).getTime()
      const end = new Date(a.end_time).getTime()

      // 客户端只展示进行中(active)和已结束(ended)，不包含未开始
      if (now < start)
        return false

      const isEnded = now > end
      const isActive = !isEnded

      if (status === 'active') {
        return isActive
      }
      if (status === 'ended') {
        return isEnded
      }
      return true
    })

    if (keyword && keyword.trim()) {
      const k = keyword.trim().toLowerCase()
      filtered = filtered.filter(a => a.title.toLowerCase().includes(k) || (a.description && a.description.toLowerCase().includes(k)))
    }

    const startIdx = (page - 1) * pageSize
    const paginated = filtered.slice(startIdx, startIdx + pageSize)

    return ok({
      total: filtered.length,
      list: paginated.map(a => ({
        ...a,
        cover_image: toThumbMedia(a.cover_image),
      })),
    })
  }),
]
