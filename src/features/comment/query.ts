import type { InfiniteData } from '@tanstack/vue-query'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import type { MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'
import type { PageResult } from '@/service/contract/types'
import { nextPageByLoadedCount } from '@/service/query/pagination'
import { qk } from '@/service/query/keys'
import { useAuthStore } from '@/store/auth'
import { deleteComment, getComments, postComment, setCommentLike } from './api'
import type { CommentQueryParams, CommentVM } from './types'

export function useInfiniteCommentList(
  photoId: MaybeRefOrGetter<number>,
  params?: MaybeRefOrGetter<CommentQueryParams | undefined>,
) {
  const authStore = useAuthStore()
  return useInfiniteQuery<PageResult<CommentVM>>({
    queryKey: computed(() => [...qk.comment.list(toValue(photoId), toValue(params)), authStore.isLoggedIn]),
    queryFn: ({ pageParam = 1 }) => getComments(toValue(photoId), { ...toValue(params), page: pageParam as number, page_size: 20 }),
    initialPageParam: 1,
    getNextPageParam: nextPageByLoadedCount,
    enabled: computed(() => toValue(photoId) > 0),
  })
}

export function usePostComment(photoId: MaybeRefOrGetter<number>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (content: string) => postComment(toValue(photoId), content),
    onMutate: async (content: string) => {
      const pid = toValue(photoId)
      const matchCommentQuery = (query: { queryKey: readonly unknown[] }) =>
        Array.isArray(query.queryKey) && query.queryKey[0] === 'comment' && query.queryKey[2] === pid

      await queryClient.cancelQueries({ predicate: matchCommentQuery })
      const prev = queryClient.getQueriesData<unknown>({ predicate: matchCommentQuery })

      const currentUser = queryClient.getQueryData<{ id?: number, nickname?: string, avatar?: string }>(qk.user.info())
      const optimisticComment: CommentVM = {
        id: -Date.now(),
        content,
        author: {
          id: currentUser?.id ?? 0,
          nickname: currentUser?.nickname ?? '我',
          avatar: currentUser?.avatar ?? '',
        },
        liked: false,
        likesCount: 0,
        createdAt: '刚刚',
      }

      queryClient.setQueriesData<InfiniteData<PageResult<CommentVM>>>(
        { predicate: matchCommentQuery },
        (old) => {
          if (!old)
            return old
          if ('pages' in old && Array.isArray(old.pages)) {
            if (old.pages.length === 0) {
              return {
                ...old,
                pages: [{ list: [optimisticComment], total: 1 }],
              }
            }
            return {
              ...old,
              pages: old.pages.map((page, index) =>
                index === 0
                  ? {
                      ...page,
                      list: [optimisticComment, ...(Array.isArray(page.list) ? page.list : [])],
                      total: (page.total ?? 0) + 1,
                    }
                  : page,
              ),
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.comment.list(toValue(photoId)) })
    },
  })
}

export function useDeleteComment(photoId: MaybeRefOrGetter<number>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (commentId: number) => deleteComment(commentId),
    onMutate: async (commentId: number) => {
      const matchCommentQuery = (query: { queryKey: readonly unknown[] }) =>
        Array.isArray(query.queryKey) && query.queryKey[0] === 'comment'

      await queryClient.cancelQueries({ predicate: matchCommentQuery })
      const prev = queryClient.getQueriesData<unknown>({ predicate: matchCommentQuery })

      queryClient.setQueriesData<InfiniteData<PageResult<CommentVM>>>(
        { predicate: matchCommentQuery },
        (old) => {
          if (!old)
            return old
          if ('pages' in old && Array.isArray(old.pages)) {
            return {
              ...old,
              pages: old.pages.map(page => ({
                ...page,
                list: Array.isArray(page.list)
                  ? page.list.filter(item => item.id !== commentId)
                  : page.list,
                total: Math.max(0, (page.total ?? 0) - 1),
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.comment.list(toValue(photoId)) })
    },
  })
}

export function useSetCommentLike(_photoId?: MaybeRefOrGetter<number>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ commentId, liked }: { commentId: number, liked: boolean }) => setCommentLike(commentId, liked),
    // 乐观热更新：点击瞬间立即翻转按钮状态与点赞数字
    onMutate: async ({ commentId, liked }) => {
      const matchCommentQuery = (query: { queryKey: readonly unknown[] }) =>
        Array.isArray(query.queryKey) && query.queryKey[0] === 'comment'

      await queryClient.cancelQueries({ predicate: matchCommentQuery })
      const prev = queryClient.getQueriesData<unknown>({ predicate: matchCommentQuery })

      queryClient.setQueriesData<InfiniteData<PageResult<CommentVM>>>(
        { predicate: matchCommentQuery },
        (old) => {
          if (!old)
            return old
          if ('pages' in old && Array.isArray(old.pages)) {
            return {
              ...old,
              pages: old.pages.map(page => ({
                ...page,
                list: Array.isArray(page.list)
                  ? page.list.map((item) => {
                      if (item.id !== commentId)
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
