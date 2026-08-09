import type { ImageVM, PageParams } from '@/service/contract/types'
import type { ActivityStatusType } from './derive-status'

export interface ActivityQueryParams extends PageParams {
  status?: 'active' | 'ended'
  keyword?: string
}

export interface ActivityVM {
  id: number
  title: string
  description: string
  coverImage: ImageVM
  photoCount: number
  startTime: string
  endTime: string
  status: ActivityStatusType
}
