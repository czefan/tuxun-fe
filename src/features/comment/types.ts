import type { PageParams } from '@/service/contract/types'

export interface CommentQueryParams extends PageParams {
  sort_by?: 'created_at' | 'likes_count'
}

export interface CommentVM {
  id: number
  author: {
    id: number
    nickname: string
    avatar: string
  }
  content: string
  liked: boolean
  likesCount: number
  createdAt: string
}
