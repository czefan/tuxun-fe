import type { ImageVM, Location, PageParams } from '@/service/contract/types'

export interface PhotoQueryParams extends PageParams {
  activity_id?: number
  activity_status?: 'active' | 'ended'
  keyword?: string
  sort_by?: 'created_at' | 'hot'
  /** 本人是否已破解（契约 2026-08-02 起改为本人口径，未登录时后端恒按 false 处理） */
  solved?: boolean
}

interface PhotoAuthorVM {
  id: number
  nickname: string
  avatar: string
}

export interface PhotoCardVM {
  id: number
  title: string
  image: ImageVM
  author: PhotoAuthorVM
  likesCount: number
  liked: boolean
  solved: boolean
  createdAt: string
}

export interface PhotoDetailVM {
  id: number
  title: string
  description: string
  image: ImageVM
  author: PhotoAuthorVM
  activity: {
    id: number
    title: string
    startTime: string
    endTime: string
  }
  location: Location | null
  attemptsCount: number
  userAttemptsCount: number
  solvedCount: number
  solved: boolean
  likesCount: number
  liked: boolean
  createdAt: string
  status: 'pending' | 'approved' | 'rejected'
}

export interface CreatePhotoPayload {
  filePath: string
  title: string
  description: string
  activityId: number
  latitude: number
  longitude: number
  coordType: 'wgs84' | 'gcj02'
}
