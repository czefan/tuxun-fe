import { onPullDownRefresh, onReachBottom, onShow } from '@dcloudio/uni-app'
import type { Ref } from 'vue'

export interface UseInfiniteListPageOptions {
  hasNextPage?: Ref<boolean | undefined>
  isFetchingNextPage?: Ref<boolean | undefined>
  isFetching?: Ref<boolean>
  isStale?: Ref<boolean>
  fetchNextPage: () => unknown
  refetch: () => Promise<unknown>
  enabled?: () => boolean
}

let pendingRefreshes = 0

/**
 * 列表页标准分页与下拉刷新管理。
 *
 * 统一封装 onReachBottom 与 onPullDownRefresh 样板代码，
 * 支持通过 enabled 谓词按 Tab 分流，确保多 Tab 页面独立刷新与触底加载。
 */
export function useInfiniteListPage(options: UseInfiniteListPageOptions) {
  function loadMore() {
    if (options.enabled && !options.enabled()) return
    if (options.isFetching?.value || options.isFetchingNextPage?.value) return
    if (options.hasNextPage?.value) return options.fetchNextPage()
  }

  onReachBottom(loadMore)

  onShow(async () => {
    if (options.enabled && !options.enabled()) return
    try {
      if (options.isStale?.value && !options.isFetching?.value) await options.refetch()
    } catch {
      // 保留列表错误态，页面恢复时不向生命周期泄漏异常。
    }
  })

  onPullDownRefresh(async () => {
    pendingRefreshes++
    try {
      // 同页多个 Tab 的生命周期会依次触发，让它们先全部进入本轮刷新。
      await Promise.resolve()
      if (!options.enabled || options.enabled()) await options.refetch()
    } catch {
      // 请求层和列表错误态负责反馈，避免页面生命周期产生未处理的 rejection。
    } finally {
      if (--pendingRefreshes === 0) uni.stopPullDownRefresh()
    }
  })

  return { loadMore }
}
