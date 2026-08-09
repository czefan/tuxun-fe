import { useQuery } from '@tanstack/vue-query'
import type { MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'
import { qk } from '@/service/query/keys'
import { getContent } from './api'
import type { ContentKey } from './types'

export function useContent(key: MaybeRefOrGetter<ContentKey>) {
  return useQuery({
    queryKey: computed(() => qk.content.detail(toValue(key))),
    queryFn: () => getContent(toValue(key)),
    enabled: computed(() => Boolean(toValue(key))),
  })
}
