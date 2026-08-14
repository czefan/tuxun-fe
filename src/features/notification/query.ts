import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'
import type { PageParams } from '@/service/contract/types'
import { nextPageByLoadedCount } from '@/service/query/pagination'
import { qk } from '@/service/query/keys'
import {
  getAnnouncementDetail,
  getAnnouncements,
  getInteractions,
  markAllInteractionsRead,
  markInteractionRead,
} from './api'
import type { AnnouncementQueryParams, AnnouncementVM, InteractionMessageVM, NotificationPageResult } from './types'

export function useInfiniteAnnouncements(
  params?: MaybeRefOrGetter<AnnouncementQueryParams | undefined>,
  options?: { enabled?: MaybeRefOrGetter<boolean> },
) {
  return useInfiniteQuery<NotificationPageResult<AnnouncementVM>>({
    queryKey: computed(() => qk.notification.announcements(toValue(params))),
    queryFn: ({ pageParam = 1 }) => getAnnouncements({ ...toValue(params), page: pageParam as number, page_size: 20 }),
    initialPageParam: 1,
    getNextPageParam: nextPageByLoadedCount,
    enabled: computed(() => (options?.enabled !== undefined ? toValue(options.enabled) : true)),
  })
}

export function useAnnouncementDetail(id: MaybeRefOrGetter<number>) {
  return useQuery({
    queryKey: computed(() => qk.notification.announcementDetail(toValue(id))),
    queryFn: () => getAnnouncementDetail(toValue(id)),
    enabled: computed(() => toValue(id) > 0),
  })
}

export function useInfiniteInteractions(params?: MaybeRefOrGetter<PageParams & { type?: ('like' | 'comment')[] } | undefined>, options?: { enabled?: MaybeRefOrGetter<boolean> }) {
  return useInfiniteQuery<NotificationPageResult<InteractionMessageVM>>({
    queryKey: computed(() => qk.notification.interactions(toValue(params))),
    queryFn: ({ pageParam = 1 }) => getInteractions({ ...toValue(params), page: pageParam as number, page_size: 20 }),
    initialPageParam: 1,
    getNextPageParam: nextPageByLoadedCount,
    enabled: computed(() => (options?.enabled !== undefined ? toValue(options.enabled) : true)),
  })
}

export function useMarkInteractionRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => markInteractionRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.notification.interactions() })
    },
  })
}

export function useMarkAllInteractionsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => markAllInteractionsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.notification.interactions() })
    },
  })
}
