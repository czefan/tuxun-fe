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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.comment.list(toValue(photoId)) })
    },
  })
}

export function useDeleteComment(photoId: MaybeRefOrGetter<number>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (commentId: number) => deleteComment(commentId),
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

      queryClient.setQueriesData<any>(
        { predicate: matchCommentQuery },
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
