import { request } from '@/service/request'
import { clampPageParams } from '@/service/contract/types'
import type { PageParams, PageResult, ScoreLog } from '@/service/contract/types'
import type { ScoreLogVM } from './types'

import { formatDate } from '@/utils/date'

export interface ScoreLogsResult extends PageResult<ScoreLogVM> {
  totalIncome: number
  totalExpense: number
}

/** 积分变动明细 GET /score/logs（权限：L1） */
export async function getScoreLogs(params?: PageParams): Promise<ScoreLogsResult> {
  const { page, page_size } = clampPageParams(params)
  const raw = await request<PageResult<ScoreLog> & { total_income?: number, total_expense?: number }>({
    url: '/score/logs',
    method: 'GET',
    query: {
      page,
      page_size,
    },
  })

  const rawList = Array.isArray(raw?.list) ? raw.list : []
  const list = rawList.map(item => ({
    id: item.id,
    delta: item.delta,
    balance: item.balance,
    reason: item.reason,
    relatedId: item.related_id,
    relatedType: item.related_type,
    relatedTitle: item.related_title,
    createdAt: formatDate(item.created_at),
  }))

  return {
    list,
    total: raw?.total ?? 0,
    totalIncome: raw?.total_income ?? 0,
    totalExpense: raw?.total_expense ?? 0,
  }
}
