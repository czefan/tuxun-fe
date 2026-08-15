import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import type { MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'
import { nextPageByLoadedCount } from '@/service/query/pagination'
import { qk } from '@/service/query/keys'
import { useAuthStore } from '@/store/auth'
import { getMyAttempts, getSolves, setSolveLike, submitAttempt } from './api'
import type { SolveItemVM, SubmitAttemptPayload, UserAttemptVM } from './types'
import type { PageParams, PageResult } from '@/service/contract/types'

export function useInfiniteSolvesList(
  photoId: MaybeRefOrGetter<number>,
  params?: MaybeRefOrGetter<PageParams | undefined>,
) {
  const authStore = useAuthStore()
  return useInfiniteQuery<PageResult<SolveItemVM>>({
    queryKey: computed(() => [...qk.attempt.solves(toValue(photoId), toValue(params)), authStore.isLoggedIn]),
    queryFn: ({ pageParam = 1 }) => getSolves(toValue(photoId), { ...toValue(params), page: pageParam as number, page_size: 20 }),
    initialPageParam: 1,
    getNextPageParam: nextPageByLoadedCount,
    enabled: computed(() => toValue(photoId) > 0),
  })
}

export function useInfiniteMyAttemptsList(
  photoId: MaybeRefOrGetter<number>,
  params?: MaybeRefOrGetter<PageParams | undefined>,
) {
  const authStore = useAuthStore()
  return useInfiniteQuery<PageResult<UserAttemptVM>>({
    queryKey: computed(() => [...qk.attempt.userAttempts(toValue(photoId), toValue(params)), authStore.isLoggedIn]),
    queryFn: ({ pageParam = 1 }) => getMyAttempts(toValue(photoId), { ...toValue(params), page: pageParam as number, page_size: 20 }),
    initialPageParam: 1,
    getNextPageParam: nextPageByLoadedCount,
    enabled: computed(() => toValue(photoId) > 0),
  })
}

export function useSubmitAttempt(photoId: MaybeRefOrGetter<number>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SubmitAttemptPayload) => submitAttempt(payload),
    onSuccess: (res) => {
      const targetPhotoId = toValue(photoId)
      const isSolved = res.status === 'solved'

      // 精确热更新全站所有 photo 缓存中的 solved 状态与已破解数
      const matchPhotoQuery = (query: { queryKey: readonly unknown[] }) =>
        Array.isArray(query.queryKey) && (query.queryKey[0] === 'photo' || query.queryKey[0] === 'record')

      queryClient.setQueriesData<any>(
        { predicate: matchPhotoQuery },
        (old: any) => {
          if (!old)
            return old
          if (typeof old === 'object' && 'pages' in old && Array.isArray(old.pages)) {
            return {
              ...old,
              pages: old.pages.map((page: any) => ({
                ...page,
                list: Array.isArray(page.list)
                  ? page.list.map((item: any) => {
                      if (item.id !== targetPhotoId)
                        return item
                      return {
                        ...item,
                        solved: isSolved ? true : item.solved,
                        solvedCount: isSolved && !item.solved ? (item.solvedCount ?? 0) + 1 : item.solvedCount,
                        userAttemptsCount: (item.userAttemptsCount ?? 0) + 1,
                      }
                    })
                  : page.list,
              })),
            }
          }
          if (typeof old === 'object' && old.id === targetPhotoId) {
            return {
              ...old,
              solved: isSolved ? true : old.solved,
              solvedCount: isSolved && !old.solved ? (old.solvedCount ?? 0) + 1 : old.solvedCount,
              userAttemptsCount: (old.userAttemptsCount ?? 0) + 1,
            }
          }
          return old
        },
      )

      queryClient.invalidateQueries({ queryKey: qk.attempt.userAttempts(targetPhotoId) })
      queryClient.invalidateQueries({ queryKey: qk.attempt.solves(targetPhotoId) })
      queryClient.invalidateQueries({ queryKey: qk.photo.detail(targetPhotoId) })
      queryClient.invalidateQueries({ queryKey: qk.photo.all() })
      queryClient.invalidateQueries({ queryKey: qk.user.info() })
    },
  })
}

export function useSetSolveLike(_photoId?: MaybeRefOrGetter<number>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ solveId, liked }: { solveId: number, liked: boolean }) => setSolveLike(solveId, liked),
    // 乐观热更新：点击瞬间立即翻转按钮状态与点赞数字
    onMutate: async ({ solveId, liked }) => {
      const matchAttemptQuery = (query: { queryKey: readonly unknown[] }) =>
        Array.isArray(query.queryKey) && query.queryKey[0] === 'attempt'

      await queryClient.cancelQueries({ predicate: matchAttemptQuery })
      const prev = queryClient.getQueriesData<unknown>({ predicate: matchAttemptQuery })

      queryClient.setQueriesData<any>(
        { predicate: matchAttemptQuery },
        (old: any) => {
          if (!old)
            return old
          if (typeof old === 'object' && 'pages' in old && Array.isArray(old.pages)) {
            return {
              ...old,
              pages: old.pages.map((page: any) => ({
                ...page,
                list: Array.isArray(page.list)
                  ? page.list.map((item: any) => {
                      if (item.id !== solveId)
                        return item
                      const delta = item.liked === liked ? 0 : (liked ? 1 : -1)
                      return { ...item, liked, likesCount: Math.max(0, (item.likesCount ?? 0) + delta) }
                    })
                  : page.list,
              })),
            }
          }
          return old
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
  })
}
