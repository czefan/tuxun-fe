import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import type { MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'
import type { PageParams, PageResult } from '@/service/contract/types'
import { nextPageByLoadedCount } from '@/service/query/pagination'
import { qk } from '@/service/query/keys'
import { exchangeGood, getExchanges, getGoods } from './api'
import type { ExchangeRecordVM, GoodsQueryParams, GoodsVM } from './types'

export function useInfiniteGoodsList(params?: MaybeRefOrGetter<GoodsQueryParams | undefined>) {
  return useInfiniteQuery<PageResult<GoodsVM>>({
    queryKey: computed(() => qk.mall.goods(toValue(params))),
    queryFn: ({ pageParam = 1 }) => getGoods({ ...toValue(params), page: pageParam as number, page_size: 20 }),
    initialPageParam: 1,
    getNextPageParam: nextPageByLoadedCount,
  })
}

export function useInfiniteExchangeList(params?: MaybeRefOrGetter<PageParams & { status?: string } | undefined>) {
  return useInfiniteQuery<PageResult<ExchangeRecordVM>>({
    queryKey: computed(() => qk.mall.exchanges(toValue(params))),
    queryFn: ({ pageParam = 1 }) => getExchanges({ ...toValue(params), page: pageParam as number, page_size: 20 }),
    initialPageParam: 1,
    getNextPageParam: nextPageByLoadedCount,
  })
}

export function useExchangeGood() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ goodId, quantity, idempotencyKey }: { goodId: number, quantity?: number, idempotencyKey: string }) =>
      exchangeGood({ good_id: goodId, quantity: quantity || 1 }, idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.mall.goods() })
      queryClient.invalidateQueries({ queryKey: qk.mall.exchanges() })
      queryClient.invalidateQueries({ queryKey: qk.user.info() })
    },
  })
}
