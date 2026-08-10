import { http } from 'msw'
import { db } from '../data/db'
import { created, ok } from '../response'
import { paginateArray, parsePaginationParams } from '../utils'

export const commentHandlers = [
  http.get('*/api/photos/:id/comments', ({ params, request }) => {
    const photoId = Number(params.id)
    const { page, pageSize } = parsePaginationParams(request.url)
    // 契约：GET 评论列表支持 sort_by=created_at/likes_count（均降序、同值按 id 倒序）；非法值回退默认排序
    const rawSortBy = new URL(request.url).searchParams.get('sort_by')
    const sortBy: 'created_at' | 'likes_count' | undefined = rawSortBy === 'created_at' || rawSortBy === 'likes_count' ? rawSortBy : undefined
    const list = db.getCommentsByPhotoId(photoId, sortBy)
    const paginated = paginateArray(list, page, pageSize)
    return ok({
      total: list.length,
      list: paginated,
    })
  }),

  http.post('*/api/photos/:id/comments', async ({ params, request }) => {
    const photoId = Number(params.id)
    const body = (await request.json().catch(() => ({}))) as { content?: string }
    const content = body.content || '好图！'
    return created(db.createComment(photoId, content))
  }),

  http.delete('*/api/comments/:id', ({ params }) => {
    const id = Number(params.id)
    return ok({ id, status: 'deleted' })
  }),

  http.put('*/api/comments/:id/like', async ({ params, request }) => {
    const id = Number(params.id)
    const body = (await request.json().catch(() => ({}))) as { liked?: boolean }
    const liked = Boolean(body.liked)
    let item = db.comments.find(c => c.id === id)
    if (!item) {
      item = {
        id,
        photo_id: 101,
        author: { id: 1, nickname: '探秘玩家', avatar: db.user.avatar },
        content: '示例评论',
        liked: false,
        likes_count: 5,
        status: 'approved' as const,
        created_at: new Date().toISOString(),
      }
      db.comments.push(item)
    }
    const previousLiked = item.liked
    item.liked = liked
    if (previousLiked !== liked) {
      item.likes_count = Math.max(0, item.likes_count + (liked ? 1 : -1))
    }
    return ok({ liked: item.liked, likes_count: item.likes_count })
  }),
]
