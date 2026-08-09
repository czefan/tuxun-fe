import { request } from '@/service/request'
import type { Media, PageResult, PhotoUserDetail } from '@/service/contract/types'
import { clampPageParams, toImageVM } from '@/service/contract/types'
import type {
  UserAttemptQueryParams,
  UserAttemptRecordVM,
  UserPhotoDetailVM,
  UserPhotoQueryParams,
  UserPhotoVM,
} from './types'

import { formatDate } from '@/utils/date'

/** 获取我的投稿记录列表 GET /photos/user（权限：L1） */
export async function getMyPhotos(params?: UserPhotoQueryParams): Promise<PageResult<UserPhotoVM>> {
  const { page, page_size } = clampPageParams(params)
  const raw = await request<PageResult<{
    id: number
    title: string
    image: Media
    created_at: string
    status: 'pending' | 'approved' | 'rejected'
  }>>({
    url: '/photos/user',
    method: 'GET',
    query: {
      activity_id: params?.activity_id,
      status: params?.status,
      page,
      page_size,
    },
  })

  const list = raw.list.map((item) => {
    const image = toImageVM(item.image)
    return {
      id: item.id,
      title: item.title,
      image,
      createdAt: formatDate(item.created_at),
      status: item.status,
    }
  })

  return { list, total: raw.total }
}

/** 获取我的投稿详情 GET /photos/user/{id}（权限：L1，包含完整原图、定位、驳回原因） */
export async function getMyPhotoDetail(id: number): Promise<UserPhotoDetailVM> {
  const raw = await request<PhotoUserDetail>({
    url: `/photos/user/${id}`,
    method: 'GET',
  })

  const image = toImageVM(raw.image)

  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    image,
    createdAt: formatDate(raw.created_at),
    status: raw.status,
    rejectReason: raw.reject_reason,
    location: raw.location,
    activity: raw.activity,
  }
}

/** 获取我的作答记录列表 GET /attempts/user（权限：L1） */
export async function getMyAttemptRecords(params?: UserAttemptQueryParams): Promise<PageResult<UserAttemptRecordVM>> {
  const { page, page_size } = clampPageParams(params)
  const raw = await request<PageResult<{
    id: number
    user_attempts_count: number
    status: 'pending' | 'solved' | 'unsolved'
    created_at: string
    photo: {
      id: number
      title: string
      image: Media
    }
  }>>({
    url: '/attempts/user',
    method: 'GET',
    query: {
      activity_id: params?.activity_id,
      status: params?.status,
      page,
      page_size,
    },
  })

  const list = raw.list.map((item) => {
    const image = toImageVM(item.photo.image)
    return {
      id: item.id,
      userAttemptsCount: item.user_attempts_count,
      status: item.status,
      createdAt: formatDate(item.created_at),
      photo: {
        id: item.photo.id,
        title: item.photo.title,
        image,
      },
    }
  })

  return { list, total: raw.total }
}
