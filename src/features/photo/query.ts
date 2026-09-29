import { beginOptimisticUpdate } from '@/service/query/optimistic'
import type { InfiniteData, QueryClient } from '@tanstack/vue-query'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'
import type { PageResult } from '@/service/contract/types'
import { nextPageByLoadedCount } from '@/service/query/pagination'
import { qk } from '@/service/query/keys'
import { resolveEnabled } from '@/service/query/enabled'
import { useAuthStore } from '@/store/auth'
import { createPhoto, getPhotoDetail, getPhotos, setPhotoLike } from './api'
import type {
  CreatePhotoPayload,
  PhotoCardVM,
  PhotoDetailVM,
  PhotoFilterParams,
  PhotoQueryParams,
} from './types'

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

export function useInfinitePhotoList(
  params?: MaybeRefOrGetter<PhotoQueryParams | undefined>,
  options?: { enabled?: MaybeRefOrGetter<boolean> },
) {
  const authStore = useAuthStore()
  return useInfiniteQuery<PageResult<PhotoCardVM>>({
    queryKey: computed(() => [...qk.photo.list(toValue(params)), authStore.isLoggedIn]),
    queryFn: ({ pageParam = 1 }) =>
      getPhotos({ ...toValue(params), page: pageParam as number, page_size: 20 }),
    initialPageParam: 1,
    getNextPageParam: nextPageByLoadedCount,
    enabled: resolveEnabled(true, options?.enabled),
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
    mutationFn: ({ id, liked }: { id: number; liked: boolean }) => setPhotoLike(id, liked),
    // 乐观热更新：点击瞬间立即翻转按钮状态与点赞数字，零延迟无感体验
    onMutate: async ({ id, liked }) => {
      const matchPhotoQuery = (query: { queryKey: readonly unknown[] }) =>
        Array.isArray(query.queryKey) && query.queryKey[0] === 'photo'

      const finishUpdate = await beginOptimisticUpdate(queryClient, { predicate: matchPhotoQuery })

      queryClient.setQueriesData<InfiniteData<PageResult<PhotoCardVM>> | PhotoDetailVM>(
        { predicate: matchPhotoQuery },
        (old) => {
          if (!old) return old
          // 列表缓存：无限分页结构 { pages: [{ list }] }
          if ('pages' in old && Array.isArray(old.pages)) {
            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                list: Array.isArray(page.list)
                  ? page.list.map((item) => {
                      if (item.id !== id) return item
                      const delta = item.liked === liked ? 0 : liked ? 1 : -1
                      return {
                        ...item,
                        liked,
                        likesCount: Math.max(0, (item.likesCount ?? 0) + delta),
                      }
                    })
                  : page.list,
              })),
            }
          }
          // 详情缓存：单对象
          if ('id' in old && old.id === id) {
            const delta = old.liked === liked ? 0 : liked ? 1 : -1
            return { ...old, liked, likesCount: Math.max(0, (old.likesCount ?? 0) + delta) }
          }
          return old
        },
      )
      return finishUpdate()
    },
    onError: (_err, _vars, ctx) => {
      ctx?.rollback()
    },
    onSettled: (_data, _error, _variables, ctx) => {
      if (!ctx?.isCurrent()) return
      queryClient.invalidateQueries({ queryKey: qk.photo.all() })
    },
  })
}

/**
 * 从已缓存的题目列表里找相邻题。
 *
 * 详情页的上下滑切题必须沿着「用户进来时那个列表」走 —— 用户是从某个
 * 筛选/排序结果点进来的，重新请求会跳到别的顺序上。所以这里匹配 queryKey
 * 里的查询参数，而不是发新请求。
 */
export function findAdjacentPhotoId(
  queryClient: QueryClient,
  params: PhotoFilterParams | null | undefined,
  currentId: number,
  offset: 1 | -1,
): number | null {
  // 1. 若携带来源列表参数，通过匹配列表查询缓存（兼容 page_size 等默认字段差异）精准定位
  if (params) {
    const listQueries = queryClient.getQueriesData<
      InfiniteData<{ list: PhotoCardVM[]; total?: number }>
    >({ queryKey: qk.photo.all() })
    for (const [key, data] of listQueries) {
      if (Array.isArray(key) && key[1] === 'list' && typeof key[2] === 'object' && key[2]) {
        const p = key[2] as Record<string, any>
        const match =
          (params.activity_id === undefined || p.activity_id === params.activity_id) &&
          (params.activity_status === undefined || p.activity_status === params.activity_status) &&
          (params.sort_by === undefined || p.sort_by === params.sort_by) &&
          (params.solved === undefined || p.solved === params.solved) &&
          (params.keyword === undefined || p.keyword === params.keyword)

        if (match && data?.pages) {
          const list: PhotoCardVM[] = data.pages.flatMap((pg) => pg.list ?? [])
          const idx = list.findIndex((item) => item.id === currentId)
          if (idx !== -1) {
            // 已找到来源列表，即使到达边界也不能跳到另一个筛选缓存。
            return list[idx + offset]?.id ?? null
          }
        }
      }
    }
  }

  // 2. 回退兜底：从所有包含当前题目的 photo 列表缓存中查找
  const queries = queryClient.getQueriesData<InfiniteData<{ list: PhotoCardVM[]; total?: number }>>(
    { queryKey: qk.photo.all() },
  )
  for (const [_, data] of queries) {
    const list: PhotoCardVM[] = data?.pages?.flatMap((p) => p.list ?? []) ?? []
    const idx = list.findIndex((p) => p.id === currentId)
    if (idx !== -1 && list[idx + offset]) {
      return list[idx + offset].id
    }
  }
  return null
}

/**
 * 从已缓存的题目列表中查找指定 ID 的题目卡片快照。
 * 用于详情页首屏或切题时，在详情接口或大图返回前进行零延迟缩略图与骨架占位。
 */
export function findCachedPhotoCard(queryClient: QueryClient, id: number): PhotoCardVM | null {
  if (!id) return null
  const queries = queryClient.getQueriesData<InfiniteData<{ list: PhotoCardVM[]; total?: number }>>(
    { queryKey: qk.photo.all() },
  )
  for (const [_, data] of queries) {
    const list: PhotoCardVM[] = data?.pages?.flatMap((p) => p.list ?? []) ?? []
    const found = list.find((p) => p.id === id)
    if (found) return found
  }
  return null
}
