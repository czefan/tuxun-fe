import { useInfiniteQuery, useQuery } from '@tanstack/vue-query'
import type { MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'
import type { PageResult } from '@/service/contract/types'
import { nextPageByLoadedCount } from '@/service/query/pagination'
import { qk } from '@/service/query/keys'
import { useAuthStore } from '@/store/auth'
import { getMyAttemptRecords, getMyPhotoDetail, getMyPhotos } from './api'
import type { UserAttemptQueryParams, UserAttemptRecordVM, UserPhotoQueryParams, UserPhotoVM } from './types'

export function useInfiniteMyPhotos(
  params?: MaybeRefOrGetter<UserPhotoQueryParams | undefined>,
  options?: { enabled?: MaybeRefOrGetter<boolean> },
) {
  const authStore = useAuthStore()
  return useInfiniteQuery<PageResult<UserPhotoVM>>({
    queryKey: computed(() => qk.record.photos(toValue(params))),
    queryFn: ({ pageParam = 1 }) => getMyPhotos({ ...toValue(params), page: pageParam as number, page_size: 20 }),
    initialPageParam: 1,
    getNextPageParam: nextPageByLoadedCount,
    enabled: computed(() => authStore.isLoggedIn && (options?.enabled === undefined ? true : toValue(options.enabled))),
  })
}

export function useMyPhotoDetail(
  id: MaybeRefOrGetter<number | null | undefined>,
  options?: { enabled?: MaybeRefOrGetter<boolean> },
) {
  const authStore = useAuthStore()
  return useQuery({
    queryKey: computed(() => qk.record.photoDetail(toValue(id) || 0)),
    queryFn: () => getMyPhotoDetail(toValue(id)!),
    enabled: computed(() => authStore.isLoggedIn && Boolean(toValue(id) && toValue(id)! > 0) && (options?.enabled === undefined ? true : toValue(options.enabled))),
  })
}

export function useInfiniteMyAttemptRecords(
  params?: MaybeRefOrGetter<UserAttemptQueryParams | undefined>,
  options?: { enabled?: MaybeRefOrGetter<boolean> },
) {
  const authStore = useAuthStore()
  return useInfiniteQuery<PageResult<UserAttemptRecordVM>>({
    queryKey: computed(() => qk.record.attempts(toValue(params))),
    queryFn: ({ pageParam = 1 }) => getMyAttemptRecords({ ...toValue(params), page: pageParam as number, page_size: 20 }),
    initialPageParam: 1,
    getNextPageParam: nextPageByLoadedCount,
    enabled: computed(() => authStore.isLoggedIn && (options?.enabled === undefined ? true : toValue(options.enabled))),
  })
}
