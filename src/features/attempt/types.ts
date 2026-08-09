import type { ImageVM, Location } from '@/service/contract/types'

export interface SubmitAttemptPayload {
  photoId: number
  filePath: string
  latitude: number
  longitude: number
  coordType?: 'wgs84' | 'gcj02' | 'bd09'
}

export interface SubmitAttemptResultVM {
  id: number
  status: 'pending' | 'solved' | 'unsolved' | string
}

export interface SolveItemVM {
  id: number
  author: {
    id: number
    nickname: string
    avatar: string
  }
  image: ImageVM
  likesCount: number
  liked: boolean
  createdAt: string
}

export interface UserAttemptVM {
  id: number
  image: ImageVM
  location?: Location | null
  createdAt: string
  status: 'pending' | 'solved' | 'unsolved'
  rejectReason?: string | null
}

export type SolveRecordVM = SolveItemVM
export type MyAttemptVM = UserAttemptVM
