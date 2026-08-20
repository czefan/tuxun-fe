import { onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import type { Ref } from 'vue'

export interface UseInfiniteListPageOptions {
  hasNextPage?: Ref<boolean | undefined>
  isFetchingNextPage?: Ref<boolean | undefined>
  fetchNextPage: () => unknown
  refetch: () => Promise<unknown>
  enabled?: () => boolean
}

/**
 * 列表页标准分页与下拉刷新管理。
 *
 * 统一封装 onReachBottom 与 onPullDownRefresh 样板代码，
 * 支持通过 enabled 谓词按 Tab 分流，确保多 Tab 页面独立刷新与触底加载。
 */
export function useInfiniteListPage(options: UseInfiniteListPageOptions) {
  onReachBottom(() => {
    if (options.enabled && !options.enabled())
      return
    if (options.hasNextPage?.value && !options.isFetchingNextPage?.value)
      options.fetchNextPage()
  })

  onPullDownRefresh(async () => {
    try {
      // 未激活的 Tab 实例不发起请求，但仍需在 finally 中结束下拉动画
      if (!options.enabled || options.enabled())
        await options.refetch()
    }
    finally {
      uni.stopPullDownRefresh()
    }
  })
}
