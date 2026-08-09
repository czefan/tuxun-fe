import { request } from '@/service/request'
import type { ActivityCard, PageResult } from '@/service/contract/types'
import { clampPageParams, toImageVM } from '@/service/contract/types'
import { deriveActivityStatus } from './derive-status'
import type { ActivityQueryParams, ActivityVM } from './types'

/** 活动列表 GET /activity（无需登录） */
export async function getActivities(params?: ActivityQueryParams): Promise<PageResult<ActivityVM>> {
  const { page, page_size } = clampPageParams(params)
  const raw = await request<PageResult<ActivityCard>>({
    url: '/activity',
    method: 'GET',
    query: {
      status: params?.status,
      keyword: params?.keyword,
      page,
      page_size,
    },
  })

  const list = raw.list.map((item) => {
    const coverImage = toImageVM(item.cover_image)
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      coverImage,
      photoCount: item.photo_count,
      startTime: item.start_time,
      endTime: item.end_time,
      status: deriveActivityStatus(item),
    }
  })

  return {
    list,
    total: raw.total,
  }
}
