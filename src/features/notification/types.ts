import type { ImageVM, PageParams } from '@/service/contract/types'

export interface AnnouncementQueryParams extends PageParams {
  keyword?: string
}

export interface AnnouncementVM {
  id: number
  title: string
  contentPreview: string
  isRead: boolean
  createdAt: string
  rawCreatedAt?: string
}

export interface AnnouncementDetailVM {
  id: number
  title: string
  content: string
  isRead: boolean
  createdAt: string
  image: ImageVM | null
  relatedType: 'activity' | null
  relatedId: number | null
}

export interface NotificationPageResult<T> {
  list: T[]
  total: number
  unreadCount: number
}

export interface InteractionMessageVM {
  id: number
  type: 'like' | 'comment'
  user: {
    id: number
    nickname: string
    avatar: string
  }
  relatedType: 'photo' | 'solve' | 'comment'
  relatedId: number
  photoId: number
  content: string
  isRead: boolean
  createdAt: string
  rawCreatedAt?: string
}
