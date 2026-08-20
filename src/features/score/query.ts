import { useInfiniteQuery } from '@tanstack/vue-query'
import type { MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'
import type { PageParams } from '@/service/contract/types'
import { nextPageByLoadedCount } from '@/service/query/pagination'
import { qk } from '@/service/query/keys'
import { useAuthStore } from '@/store/auth'
import { getScoreLogs } from './api'
import type { ScoreLogsResult } from './api'

export function useInfiniteScoreLogs(
  params?: MaybeRefOrGetter<PageParams | undefined>,
  options?: { enabled?: MaybeRefOrGetter<boolean> },
) {
  const authStore = useAuthStore()
  return useInfiniteQuery<ScoreLogsResult>({
    queryKey: computed(() => [...qk.score.logs(toValue(params)), authStore.isLoggedIn]),
    queryFn: ({ pageParam = 1 }) => getScoreLogs({ ...toValue(params), page: pageParam as number, page_size: 20 }),
    initialPageParam: 1,
    getNextPageParam: nextPageByLoadedCount,
    enabled: computed(() => authStore.isLoggedIn && (options?.enabled === undefined ? true : toValue(options.enabled))),
  })
}
