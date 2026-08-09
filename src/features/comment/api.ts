import { request } from '@/service/request'
import { clampPageParams } from '@/service/contract/types'
import type { LikeResult, PageResult } from '@/service/contract/types'
import { useAuthStore } from '@/store/auth'
import { formatDate } from '@/utils/date'
import type { CommentQueryParams, CommentVM } from './types'

/** 获取题目评论列表 GET /photos/{id}/comments（无需登录） */
export async function getComments(photoId: number, params?: CommentQueryParams): Promise<PageResult<CommentVM>> {
  const { page, page_size } = clampPageParams(params)
  const raw = await request<PageResult<{
    id: number
    author: { id: number, nickname: string, avatar: string }
    content: string
    liked: boolean
    likes_count: number
    created_at: string
  }>>({
    url: `/photos/${photoId}/comments`,
    method: 'GET',
    query: {
      sort_by: params?.sort_by,
      page,
      page_size,
    },
  })

  const authStore = useAuthStore()
  const isLoggedIn = Boolean(authStore.token || authStore.hasSession || authStore.sessionId)

  const list = raw.list.map(item => ({
    id: item.id,
    author: {
      id: item.author.id,
      nickname: item.author.nickname,
      avatar: item.author.avatar,
    },
    content: item.content,
    liked: isLoggedIn ? item.liked : false,
    likesCount: item.likes_count,
    createdAt: formatDate(item.created_at),
  }))

  return { list, total: raw.total }
}

/** 发表评论 POST /photos/{id}/comments（权限：L1） */
export function postComment(photoId: number, content: string): Promise<{ id: number, status: 'pending' }> {
  return request<{ id: number, status: 'pending' }>({
    url: `/photos/${photoId}/comments`,
    method: 'POST',
    data: { content },
  })
}

/** 删除评论 DELETE /comments/{id}（权限：L1，仅本人） */
export function deleteComment(id: number): Promise<void> {
  return request<void>({
    url: `/comments/${id}`,
    method: 'DELETE',
  })
}

/** 点赞评论 PUT /comments/{id}/like（权限：L1，幂等） */
export function setCommentLike(id: number, liked: boolean): Promise<LikeResult> {
  return request<LikeResult>({
    url: `/comments/${id}/like`,
    method: 'PUT',
    data: { liked },
  })
}
