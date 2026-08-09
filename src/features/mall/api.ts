import { request } from '@/service/request'
import type { ExchangeRecord, ExchangeResult, GoodItem, PageParams, PageResult } from '@/service/contract/types'
import { clampPageParams, toImageVM } from '@/service/contract/types'
import type { ExchangeRecordVM, GoodsQueryParams, GoodsVM } from './types'

import { formatDate } from '@/utils/date'

/** 商品列表 GET /goods（权限：L1） */
export async function getGoods(params?: GoodsQueryParams): Promise<PageResult<GoodsVM>> {
  const { page, page_size } = clampPageParams(params)
  const raw = await request<PageResult<GoodItem>>({
    url: '/goods',
    method: 'GET',
    query: {
      keyword: params?.keyword,
      page,
      page_size,
    },
  })

  const list = raw.list.map((item) => {
    const image = toImageVM(item.image)
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      image,
      scorePrice: item.score_price,
      stock: item.stock,
      status: item.status,
      createdAt: formatDate(item.created_at),
    }
  })

  return { list, total: raw.total }
}

/** 兑换商品 POST /exchange（权限：L1，必带 Idempotency-Key） */
export function exchangeGood(
  payload: { good_id: number, quantity: number },
  idempotencyKey: string,
): Promise<ExchangeResult> {
  return request<ExchangeResult>({
    url: '/exchange',
    method: 'POST',
    data: payload,
    header: {
      'Idempotency-Key': idempotencyKey,
    },
  })
}

/** 获取兑换记录 GET /exchange（权限：L1） */
export async function getExchanges(params?: PageParams & { status?: string }): Promise<PageResult<ExchangeRecordVM>> {
  const { page, page_size } = clampPageParams(params)
  const raw = await request<PageResult<ExchangeRecord>>({
    url: '/exchange',
    method: 'GET',
    query: {
      status: params?.status,
      page,
      page_size,
    },
  })

  const list = raw.list.map((item) => {
    const image = toImageVM(item.good.image)
    return {
      id: item.id,
      verifyCode: item.verify_code,
      good: {
        id: item.good.id,
        name: item.good.name,
        image,
      },
      scorePrice: item.good.score_price,
      quantity: item.quantity,
      scoreCost: item.score_cost,
      status: item.status,
      exchangeAt: item.exchange_at ? formatDate(item.exchange_at) : '',
    }
  })

  return { list, total: raw.total }
}
