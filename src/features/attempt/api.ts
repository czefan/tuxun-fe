import { request, upload } from '@/service/request'
import type { LikeResult, Location, Media, PageParams, PageResult, SubmitAttemptResult } from '@/service/contract/types'
import { clampPageParams, toImageVM } from '@/service/contract/types'
import { useAuthStore } from '@/store/auth'
import { formatDate } from '@/utils/date'
import type {
  SolveItemVM,
  SubmitAttemptPayload,
  SubmitAttemptResultVM,
  UserAttemptVM,
} from './types'

/** 提交解题作答 POST /photos/{id}/attempts（权限：L1，multipart 包含图片及坐标） */
export async function submitAttempt(payload: SubmitAttemptPayload): Promise<SubmitAttemptResultVM> {
  const raw = await upload<SubmitAttemptResult>({
    url: `/photos/${payload.photoId}/attempts`,
    filePath: payload.filePath,
    name: 'image_file',
    method: 'POST',
    formData: {
      latitude: payload.latitude,
      longitude: payload.longitude,
      coord_type: payload.coordType,
    },
  })

  return {
    id: raw.id,
    status: raw.status,
  }
}

/** 获取题目的成功作答列表 GET /photos/{id}/solves（权限：L1） */
export async function getSolves(photoId: number, params?: PageParams): Promise<PageResult<SolveItemVM>> {
  const { page, page_size } = clampPageParams(params)
  const raw = await request<PageResult<{
    id: number
    author: { id: number, nickname: string, avatar: string }
    image: Media
    likes_count: number
    liked: boolean
    created_at: string
  }>>({
    url: `/photos/${photoId}/solves`,
    method: 'GET',
    query: {
      page,
      page_size,
    },
  })

  const authStore = useAuthStore()
  const isLoggedIn = Boolean(authStore.token || authStore.hasSession || authStore.sessionId)

  const rawList = Array.isArray(raw?.list) ? raw.list : []
  const list = rawList.map((item) => {
    const image = toImageVM(item.image)
    return {
      id: item.id,
      author: {
        id: item.author.id,
        nickname: item.author.nickname,
        avatar: item.author.avatar,
      },
      image,
      likesCount: item.likes_count,
      liked: isLoggedIn ? item.liked : false,
      createdAt: formatDate(item.created_at),
    }
  })

  return { list, total: raw?.total ?? 0 }
}

/** 获取当前用户对特定题目的作答记录列表 GET /photos/{id}/attempts/user（权限：L1） */
export async function getMyAttempts(photoId: number, params?: PageParams): Promise<PageResult<UserAttemptVM>> {
  const { page, page_size } = clampPageParams(params)
  const raw = await request<PageResult<{
    id: number
    image: Media
    location?: Location | null
    created_at: string
    status: 'pending' | 'solved' | 'unsolved'
    reject_reason?: string | null
  }>>({
    url: `/photos/${photoId}/attempts/user`,
    method: 'GET',
    query: {
      page,
      page_size,
    },
  })

  const rawList = Array.isArray(raw?.list) ? raw.list : []
  const list = rawList.map((item) => {
    const image = toImageVM(item.image)
    return {
      id: item.id,
      image,
      location: item.location,
      createdAt: formatDate(item.created_at),
      status: item.status,
      rejectReason: item.reject_reason,
    }
  })

  return { list, total: raw?.total ?? 0 }
}

/** 对公开答案点赞 PUT /solves/{id}/like（权限：L1） */
export function setSolveLike(solveId: number, liked: boolean): Promise<LikeResult> {
  return request<LikeResult>({
    url: `/solves/${solveId}/like`,
    method: 'PUT',
    data: { liked },
  })
}
