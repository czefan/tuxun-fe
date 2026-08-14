import { request, upload } from '@/service/request'
import { clampPageParams, toImageVM } from '@/service/contract/types'
import type { LikeResult, Location, Media, PageResult } from '@/service/contract/types'
import type { CreatePhotoPayload, PhotoCardVM, PhotoDetailVM, PhotoQueryParams } from './types'

import { useAuthStore } from '@/store/auth'
import { formatDate } from '@/utils/date'

/** 题目列表 GET /photos（无需登录） */
export async function getPhotos(params?: PhotoQueryParams): Promise<PageResult<PhotoCardVM>> {
  const { page, page_size } = clampPageParams(params)
  const raw = await request<PageResult<{
    id: number
    title: string
    image: Media
    author: { id: number, nickname: string, avatar: string }
    likes_count: number
    liked: boolean
    solved: boolean
    created_at: string
  }>>({
    url: '/photos',
    method: 'GET',
    query: {
      activity_id: params?.activity_id,
      keyword: params?.keyword,
      sort_by: params?.sort_by,
      solved: params?.solved,
      page,
      page_size,
    },
  })

  const authStore = useAuthStore()
  const isLoggedIn = Boolean(authStore.token || authStore.hasSession || authStore.sessionId)
  const list = (raw.list || []).map((item) => {
    const image = toImageVM(item.image)
    return {
      id: item.id,
      title: item.title,
      image,
      author: {
        id: item.author.id,
        nickname: item.author.nickname,
        avatar: item.author.avatar,
      },
      likesCount: item.likes_count,
      liked: isLoggedIn ? item.liked : false,
      solved: isLoggedIn ? item.solved : false,
      createdAt: formatDate(item.created_at),
    }
  })

  return { list, total: raw.total ?? 0 }
}

/** 题目详情 GET /photos/{id}（无需登录） */
export async function getPhotoDetail(id: number): Promise<PhotoDetailVM> {
  const raw = await request<{
    id: number
    title: string
    description: string
    image: Media
    author: { id: number, nickname: string, avatar: string }
    activity: { id: number, title: string, start_time: string, end_time: string }
    location: Location | null
    attempts_count: number
    user_attempts_count: number
    solved_count: number
    solved: boolean
    likes_count: number
    liked: boolean
    created_at: string
    status: 'pending' | 'approved' | 'rejected'
  }>({
    url: `/photos/${id}`,
    method: 'GET',
  })

  const image = toImageVM(raw.image)
  const authStore = useAuthStore()
  const isLoggedIn = Boolean(authStore.token || authStore.hasSession || authStore.sessionId)

  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    image,
    author: {
      id: raw.author.id,
      nickname: raw.author.nickname,
      avatar: raw.author.avatar,
    },
    activity: {
      id: raw.activity.id,
      title: raw.activity.title,
      startTime: raw.activity.start_time,
      endTime: raw.activity.end_time,
    },
    location: raw.location,
    attemptsCount: raw.attempts_count,
    userAttemptsCount: raw.user_attempts_count,
    solvedCount: raw.solved_count,
    solved: isLoggedIn ? raw.solved : false,
    likesCount: raw.likes_count,
    liked: isLoggedIn ? raw.liked : false,
    createdAt: formatDate(raw.created_at),
    status: raw.status,
  }
}

/** 投稿 POST /photos（权限：L1，multipart） */
export function createPhoto(payload: CreatePhotoPayload): Promise<{ id: number, status: 'pending' }> {
  return upload<{ id: number, status: 'pending' }>({
    url: '/photos',
    filePath: payload.filePath,
    name: 'image_file',
    method: 'POST',
    formData: {
      title: payload.title,
      description: payload.description,
      activity_id: payload.activityId,
      latitude: payload.latitude,
      longitude: payload.longitude,
      coord_type: payload.coordType,
    },
  })
}

/** 点赞题目 PUT /photos/{id}/like（权限：L1，幂等） */
export function setPhotoLike(id: number, liked: boolean): Promise<LikeResult> {
  return request<LikeResult>({
    url: `/photos/${id}/like`,
    method: 'PUT',
    data: { liked },
  })
}
