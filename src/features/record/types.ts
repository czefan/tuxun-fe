import type { ImageVM, Location, PageParams } from '@/service/contract/types'

export interface UserPhotoQueryParams extends PageParams {
  activity_id?: number
  status?: 'pending' | 'approved' | 'rejected'
}

export interface UserAttemptQueryParams extends PageParams {
  activity_id?: number
  status?: 'pending' | 'solved' | 'unsolved'
}

export interface UserPhotoVM {
  id: number
  title: string
  image: ImageVM
  createdAt: string
  status: 'pending' | 'approved' | 'rejected'
  rejectReason?: string | null
}

/**
 * 投稿详情。
 * 契约 GET /photos/user/{id} 下发 image（仅包含 origin_url）。
 */
export interface UserPhotoDetailVM {
  id: number
  title: string
  description: string
  image: ImageVM
  createdAt: string
  status: 'pending' | 'approved' | 'rejected'
  rejectReason?: string | null
  location?: Location | null
  activity?: {
    id: number
    title: string
  } | null
}

export interface UserAttemptRecordVM {
  id: number
  userAttemptsCount: number
  status: 'pending' | 'solved' | 'unsolved'
  createdAt: string
  photo: {
    id: number
    title: string
    image: ImageVM
  }
}
