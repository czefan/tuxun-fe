import { useInfiniteQuery, useQuery } from '@tanstack/vue-query'
import type { MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'
import type { PageResult } from '@/service/contract/types'
import { nextPageByLoadedCount } from '@/service/query/pagination'
import { qk } from '@/service/query/keys'
import { getActivities } from './api'
import type { ActivityQueryParams, ActivityVM } from './types'

export function useInfiniteActivityList(params?: MaybeRefOrGetter<ActivityQueryParams | undefined>) {
  return useInfiniteQuery<PageResult<ActivityVM>>({
    queryKey: computed(() => qk.activity.list(toValue(params))),
    queryFn: ({ pageParam = 1 }) => getActivities({ ...toValue(params), page: pageParam as number, page_size: 20 }),
    initialPageParam: 1,
    getNextPageParam: nextPageByLoadedCount,
  })
}

export function useActiveActivities() {
  return useQuery({
    queryKey: qk.activity.active(),
    queryFn: () => getActivities({ status: 'active', page_size: 20 }),
  })
}
