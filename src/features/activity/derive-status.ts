import type { ActivityCard } from '@/service/contract/types'
import { serverNow } from '@/utils/server-time'

export type ActivityStatusType = 'not_started' | 'ongoing' | 'ended'

/**
 * 依据开始/结束时间与服务器基准时间推导活动状态
 */
export function deriveActivityStatus(a: Pick<ActivityCard, 'start_time' | 'end_time'>): ActivityStatusType {
  const now = serverNow()
  const start = new Date(a.start_time).getTime()
  const end = new Date(a.end_time).getTime()

  if (now < start)
    return 'not_started'
  if (now < end)
    return 'ongoing'
  return 'ended'
}
