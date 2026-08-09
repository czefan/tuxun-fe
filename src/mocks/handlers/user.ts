import { http } from 'msw'
import { db } from '../data/db'
import { ok, rateLimited } from '../response'

export const userHandlers = [
  http.get('*/api/test/login', () => {
    return ok({
      ...db.user,
      session_id: 'mock-session-id-12345678',
    })
  }),

  http.get('*/api/user/logincallback', () => {
    return ok({
      ...db.user,
      session_id: 'mock-session-id-12345678',
    })
  }),

  http.delete('*/api/user/logout', () => {
    return ok(null)
  }),

  http.get('*/api/user/info', () => {
    return ok(db.user)
  }),

  http.put('*/api/user/nickname', async ({ request }) => {
    if (db.user.nickname_edits_remaining <= 0) {
      return rateLimited('频率限制：本月昵称修改次数已用尽')
    }
    const body = (await request.json()) as { nickname?: string }
    if (body.nickname && body.nickname !== db.user.nickname) {
      db.user.nickname = body.nickname
      db.user.nickname_edits_remaining -= 1
    }
    return ok({
      nickname: db.user.nickname,
      nickname_edits_remaining: db.user.nickname_edits_remaining,
    })
  }),

  http.put('*/api/user/avatar', () => {
    if (db.user.avatar_edits_remaining <= 0) {
      return rateLimited('频率限制：本月头像修改次数已用尽')
    }
    db.user.avatar = db.meta.defaultAvatarUrl
    db.user.avatar_edits_remaining -= 1
    return ok({
      avatar: db.user.avatar,
      avatar_edits_remaining: db.user.avatar_edits_remaining,
    })
  }),

  http.post('*/api/user/avatar', ({ request }) => {
    const override = request.headers.get('X-HTTP-Method-Override')
    if (override !== 'PUT') {
      return ok({
        avatar: db.user.avatar,
        avatar_edits_remaining: db.user.avatar_edits_remaining,
      })
    }
    if (db.user.avatar_edits_remaining <= 0) {
      return rateLimited('频率限制：本月头像修改次数已用尽')
    }
    db.user.avatar = db.meta.defaultAvatarUrl
    db.user.avatar_edits_remaining -= 1
    return ok({
      avatar: db.user.avatar,
      avatar_edits_remaining: db.user.avatar_edits_remaining,
    })
  }),
]
