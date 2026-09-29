import { beginOptimisticUpdate } from '@/service/query/optimistic'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { MaybeRefOrGetter } from 'vue'
import { resolveEnabled } from '@/service/query/enabled'
import { qk } from '@/service/query/keys'
import { useAuthStore } from '@/store/auth'
import { getUserInfo, updateAvatar, updateNickname } from './api'
import type { UserInfo } from './types'

export function useUserInfo(options?: {
  silentAuth?: boolean
  /** 未登录时必须传 false，否则每次进页面都会打一发注定 401 的 /user/info */
  enabled?: MaybeRefOrGetter<boolean>
}) {
  const authStore = useAuthStore()
  return useQuery({
    queryKey: qk.user.info(),
    queryFn: () => getUserInfo({ silentAuth: options?.silentAuth }),
    enabled: resolveEnabled(() => authStore.isLoggedIn, options?.enabled),
  })
}

export function useUpdateNickname() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (nickname: string) => updateNickname(nickname),
    onMutate: async (nickname: string) => {
      const finishUpdate = await beginOptimisticUpdate(queryClient, { queryKey: qk.user.info() })
      queryClient.setQueryData<UserInfo>(qk.user.info(), (old) => {
        if (!old) return old
        return { ...old, nickname }
      })
      return finishUpdate()
    },
    onError: (_err, _vars, ctx) => {
      ctx?.rollback()
    },
    onSuccess: (_data, _variables, ctx) => {
      if (!ctx?.isCurrent()) return
      queryClient.invalidateQueries({ queryKey: qk.user.info() })
    },
  })
}

export function useUpdateAvatar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (filePath: string) => updateAvatar(filePath),
    onMutate: async (filePath: string) => {
      const finishUpdate = await beginOptimisticUpdate(queryClient, { queryKey: qk.user.info() })
      queryClient.setQueryData<UserInfo>(qk.user.info(), (old) => {
        if (!old) return old
        return { ...old, avatar: filePath }
      })
      return finishUpdate()
    },
    onError: (_err, _vars, ctx) => {
      ctx?.rollback()
    },
    onSuccess: (_data, _variables, ctx) => {
      if (!ctx?.isCurrent()) return
      queryClient.invalidateQueries({ queryKey: qk.user.info() })
    },
  })
}
