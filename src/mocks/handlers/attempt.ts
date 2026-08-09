import { http } from 'msw'
import { db } from '../data/db'
import { toBothMedia, toThumbMedia } from '../data/placeholder'
import { created, notFound, ok } from '../response'
import { paginateArray, parsePaginationParams } from '../utils'

export const attemptHandlers = [
  http.post('*/api/photos/:id/attempts', ({ params }) => {
    const photoId = Number(params.id)
    return created(db.createAttempt(photoId))
  }),

  http.get('*/api/photos/:id/solves', ({ params, request }) => {
    const photoId = Number(params.id)
    const { page, pageSize } = parsePaginationParams(request.url)
    const list = db.getSolvesByPhotoId(photoId)
    const paginated = paginateArray(list, page, pageSize)
    return ok({
      total: list.length,
      list: paginated.map(s => ({
        id: s.id,
        author: s.author,
        image: toBothMedia(s.image),
        likes_count: s.likes_count,
        liked: s.liked,
        created_at: s.created_at,
      })),
    })
  }),

  http.get('*/api/photos/:id/attempts/user', ({ params, request }) => {
    const photoId = Number(params.id)
    const { page, pageSize } = parsePaginationParams(request.url)
    const list = db.getAttemptsByPhotoId(photoId)
    const paginated = paginateArray(list, page, pageSize)
    return ok({
      total: list.length,
      list: paginated.map(a => ({
        id: a.id,
        image: toBothMedia(a.image),
        location: a.location,
        created_at: a.created_at,
        status: a.status,
        reject_reason: a.reject_reason,
      })),
    })
  }),

  http.get('*/api/attempts/user', ({ request }) => {
    const url = new URL(request.url, 'http://localhost')
    const status = url.searchParams.get('status')
    const activityId = url.searchParams.get('activity_id')
    const { page, pageSize } = parsePaginationParams(request.url)

    let filtered = [...db.attempts]

    if (status) {
      filtered = filtered.filter(a => a.status === status)
    }

    if (activityId) {
      filtered = filtered.filter(a => a.photo?.activity?.id === Number(activityId))
    }

    const paginated = paginateArray(filtered, page, pageSize)

    return ok({
      total: filtered.length,
      list: paginated.map(a => ({
        id: a.id,
        user_attempts_count: a.user_attempts_count,
        status: a.status,
        created_at: a.created_at,
        photo: {
          id: a.photo.id,
          title: a.photo.title,
          image: toThumbMedia(a.photo.image),
        },
      })),
    })
  }),

  http.put('*/api/solves/:id/like', async ({ params, request }) => {
    const id = Number(params.id)
    const body = (await request.json()) as { liked?: boolean }
    const liked = Boolean(body.liked)
    const item = db.solves.find(s => s.id === id)
    if (item) {
      item.liked = liked
      item.likes_count += liked ? 1 : -1
      return ok({ liked: item.liked, likes_count: item.likes_count })
    }
    return notFound('解题记录不存在')
  }),
]
