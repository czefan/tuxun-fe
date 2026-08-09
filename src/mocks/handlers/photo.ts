import { http } from 'msw'
import { db } from '../data/db'
import { toOriginMedia, toThumbMedia } from '../data/placeholder'
import { created, notFound, ok } from '../response'
import { paginateArray, parsePaginationParams } from '../utils'

export const photoHandlers = [
  // CRITICAL: /photos/user/{id} 优先拦截，否则会被 /photos/:id 当成 id="user"
  http.get('*/api/photos/user/:id', ({ params }) => {
    const id = Number(params.id)
    const item = db.myPhotos.find(p => p.id === id)
    // 契约：该接口只服务作者本人的 pending / rejected 投稿（或者是作者视角查看）
    if (!item) {
      return notFound('操作错误: 投稿不存在')
    }
    return ok({
      ...item,
      image: toOriginMedia(item.image),
    })
  }),

  http.get('*/api/photos/user', ({ request }) => {
    const url = new URL(request.url, 'http://localhost')
    const status = url.searchParams.get('status')
    const activityId = url.searchParams.get('activity_id')
    const { page, pageSize } = parsePaginationParams(request.url)

    let filtered = [...db.myPhotos]

    if (status) {
      filtered = filtered.filter(p => p.status === status)
    }

    if (activityId) {
      filtered = filtered.filter(p => p.activity?.id === Number(activityId))
    }

    const paginated = paginateArray(filtered, page, pageSize)

    return ok({
      total: filtered.length,
      list: paginated.map(p => ({
        id: p.id,
        title: p.title,
        image: toThumbMedia(p.image),
        created_at: p.created_at,
        status: p.status,
      })),
    })
  }),

  http.get('*/api/photos', ({ request }) => {
    const url = new URL(request.url, 'http://localhost')
    const sortBy = url.searchParams.get('sort_by')
    const keyword = url.searchParams.get('keyword')
    const activityId = url.searchParams.get('activity_id')
    const solved = url.searchParams.get('solved')
    const { page, pageSize } = parsePaginationParams(request.url)

    let filtered = [...db.photos]

    // 默认只展示进行中活动的题目（与真实 API 行为一致）
    // 若指定了 activity_id，则不做额外时间过滤，由下方精确过滤负责
    if (!activityId) {
      const now = Date.now()
      filtered = filtered.filter((p) => {
        if (!p.activity)
          return false
        const start = new Date(p.activity.start_time).getTime()
        const end = new Date(p.activity.end_time).getTime()
        return now >= start && now <= end
      })
    }

    if (activityId) {
      filtered = filtered.filter(p => p.activity?.id === Number(activityId))
    }

    if (solved !== null && solved !== undefined) {
      const isSolved = solved === 'true'
      filtered = filtered.filter(p => p.solved === isSolved)
    }

    if (keyword) {
      const kw = keyword.trim().toLowerCase()
      filtered = filtered.filter(p => p.title.toLowerCase().includes(kw) || p.description.toLowerCase().includes(kw))
    }

    if (sortBy === 'hot') {
      filtered.sort((a, b) => (b.likes_count * 2 + b.attempts_count) - (a.likes_count * 2 + a.attempts_count))
    }
    else if (sortBy === 'created_at') {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    const paginated = paginateArray(filtered, page, pageSize)

    return ok({
      total: filtered.length,
      list: paginated.map(p => ({
        id: p.id,
        title: p.title,
        image: toThumbMedia(p.image),
        author: p.author,
        likes_count: p.likes_count,
        liked: p.liked,
        solved: p.solved,
        created_at: p.created_at,
      })),
    })
  }),

  http.post('*/api/photos', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { title?: string, description?: string }
    return created(db.createPhoto(body.title || '投稿地标', body.description || '地标描述'))
  }),

  http.get('*/api/photos/:id', ({ params }) => {
    const id = Number(params.id)
    const item = db.photos.find(p => p.id === id)
    if (!item) {
      return notFound('操作错误: 题目不存在')
    }
    return ok({
      ...item,
      id,
      image: toOriginMedia(item.image),
    })
  }),

  // 点赞幂等，Body 显式指定 liked: true/false
  http.put('*/api/photos/:id/like', async ({ params, request }) => {
    const id = Number(params.id)
    const body = (await request.json()) as { liked?: boolean }
    const liked = Boolean(body.liked)
    const item = db.photos.find(p => p.id === id)
    if (item) {
      if (item.liked !== liked) {
        item.liked = liked
        item.likes_count += liked ? 1 : -1
      }
      return ok({
        liked: item.liked,
        likes_count: item.likes_count,
      })
    }
    return notFound('题目不存在')
  }),
]
