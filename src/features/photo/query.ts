import type { InfiniteData } from '@tanstack/vue-query'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'
import type { PageResult } from '@/service/contract/types'
import { nextPageByLoadedCount } from '@/service/query/pagination'
import { qk } from '@/service/query/keys'
import { useAuthStore } from '@/store/auth'
import { createPhoto, getPhotoDetail, getPhotos, setPhotoLike } from './api'
import type { CreatePhotoPayload, PhotoCardVM, PhotoDetailVM, PhotoQueryParams } from './types'

export function useCreatePhoto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreatePhotoPayload) => createPhoto(payload),
    onSuccess: () => {
      // 投稿进「我的投稿」审核列表；首页列表要等审核通过才出现，
      // 但一并失效更省心，代价只是一次多余请求
      queryClient.invalidateQueries({ queryKey: qk.record.photos() })
      queryClient.invalidateQueries({ queryKey: qk.photo.all() })
    },
  })
}

export function useInfinitePhotoList(params?: MaybeRefOrGetter<PhotoQueryParams | undefined>) {
  const authStore = useAuthStore()
  return useInfiniteQuery<PageResult<PhotoCardVM>>({
    queryKey: computed(() => [...qk.photo.list(toValue(params)), authStore.isLoggedIn]),
    queryFn: ({ pageParam = 1 }) => getPhotos({ ...toValue(params), page: pageParam as number, page_size: 20 }),
    initialPageParam: 1,
    getNextPageParam: nextPageByLoadedCount,
  })
}

export function usePhotoDetail(id: MaybeRefOrGetter<number>) {
  const authStore = useAuthStore()
  return useQuery({
    queryKey: computed(() => [...qk.photo.detail(toValue(id)), authStore.isLoggedIn]),
    queryFn: () => getPhotoDetail(toValue(id)),
    enabled: computed(() => toValue(id) > 0),
  })
}

export function useSetPhotoLike() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, liked }: { id: number, liked: boolean }) => setPhotoLike(id, liked),
    // 乐观热更新：点击瞬间立即翻转按钮状态与点赞数字，零延迟无感体验
    onMutate: async ({ id, liked }) => {
      const matchPhotoQuery = (query: { queryKey: readonly unknown[] }) =>
        Array.isArray(query.queryKey) && query.queryKey[0] === 'photo'

      await queryClient.cancelQueries({ predicate: matchPhotoQuery })
      const prev = queryClient.getQueriesData<unknown>({ predicate: matchPhotoQuery })

      queryClient.setQueriesData<InfiniteData<PageResult<PhotoCardVM>> | PhotoDetailVM>(
        { predicate: matchPhotoQuery },
        (old) => {
          if (!old)
            return old
          // 列表缓存：无限分页结构 { pages: [{ list }] }
          if ('pages' in old && Array.isArray(old.pages)) {
            return {
              ...old,
              pages: old.pages.map(page => ({
                ...page,
                list: Array.isArray(page.list)
                  ? page.list.map((item) => {
                      if (item.id !== id)
                        return item
                      const delta = item.liked === liked ? 0 : (liked ? 1 : -1)
                      return { ...item, liked, likesCount: Math.max(0, (item.likesCount ?? 0) + delta) }
                    })
                  : page.list,
              })),
            }
          }
          // 详情缓存：单对象
          if ('id' in old && old.id === id) {
            const delta = old.liked === liked ? 0 : (liked ? 1 : -1)
            return { ...old, liked, likesCount: Math.max(0, (old.likesCount ?? 0) + delta) }
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
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: qk.photo.detail(variables.id) })
    },
  })
}
