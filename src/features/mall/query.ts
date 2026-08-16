import type { InfiniteData } from '@tanstack/vue-query'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import type { MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'
import type { PageParams, PageResult } from '@/service/contract/types'
import { nextPageByLoadedCount } from '@/service/query/pagination'
import { qk } from '@/service/query/keys'
import { exchangeGood, getExchanges, getGoods } from './api'
import type { ExchangeRecordVM, GoodsQueryParams, GoodsVM } from './types'

export function useInfiniteGoodsList(
  params?: MaybeRefOrGetter<GoodsQueryParams | undefined>,
  options?: { refetchInterval?: number | false },
) {
  return useInfiniteQuery<PageResult<GoodsVM>>({
    queryKey: computed(() => qk.mall.goods(toValue(params))),
    queryFn: ({ pageParam = 1 }) => getGoods({ ...toValue(params), page: pageParam as number, page_size: 20 }),
    initialPageParam: 1,
    getNextPageParam: nextPageByLoadedCount,
    refetchInterval: options?.refetchInterval ?? 15000,
    staleTime: 5000,
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
    onMutate: async ({ goodId, quantity = 1 }) => {
      // 1. 取消正在进行的商品列表查询，避免覆盖乐观更新
      await queryClient.cancelQueries({ queryKey: ['mall', 'goods'] })
      const prev = queryClient.getQueriesData<InfiniteData<PageResult<GoodsVM>>>({ queryKey: ['mall', 'goods'] })

      // 2. 乐观扣减所有商品列表缓存中的库存，实现 0 延迟即时反馈
      queryClient.setQueriesData<InfiniteData<PageResult<GoodsVM>>>(
        { queryKey: ['mall', 'goods'] },
        (oldData) => {
          if (!oldData)
            return oldData
          return {
            ...oldData,
            pages: oldData.pages.map(page => ({
              ...page,
              list: page.list.map(good =>
                good.id === goodId
                  ? { ...good, stock: Math.max(0, good.stock - quantity) }
                  : good,
              ),
            })),
          }
        },
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        for (const [key, data] of ctx.prev) {
          queryClient.setQueryData(key, data)
        }
      }
    },
    onSuccess: () => {
      // 兑换成功后即时刷新，与后端真实数据精准对齐
      queryClient.invalidateQueries({ queryKey: ['mall', 'goods'] })
      queryClient.invalidateQueries({ queryKey: ['mall', 'exchanges'] })
      queryClient.invalidateQueries({ queryKey: ['user', 'info'] })
    },
  })
}
