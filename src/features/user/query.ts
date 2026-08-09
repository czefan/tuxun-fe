import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'
import { qk } from '@/service/query/keys'
import { getUserInfo, updateAvatar, updateNickname } from './api'

export function useUserInfo(options?: {
  silentAuth?: boolean
  /** 未登录时必须传 false，否则每次进页面都会打一发注定 401 的 /user/info */
  enabled?: MaybeRefOrGetter<boolean>
}) {
  return useQuery({
    queryKey: qk.user.info(),
    queryFn: () => getUserInfo({ silentAuth: options?.silentAuth }),
    enabled: computed(() => (options?.enabled === undefined ? true : toValue(options.enabled))),
  })
}

export function useUpdateNickname() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (nickname: string) => updateNickname(nickname),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.user.info() })
    },
  })
}

export function useUpdateAvatar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (filePath: string) => updateAvatar(filePath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.user.info() })
    },
  })
}
