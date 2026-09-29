import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useInfiniteListPage } from './use-infinite-list-page'

const hooks = vi.hoisted(() => ({
  refresh: [] as Array<() => Promise<void>>,
  bottom: [] as Array<() => unknown>,
  show: [] as Array<() => Promise<void>>,
}))
vi.mock('@dcloudio/uni-app', () => ({
  onPullDownRefresh: (fn: () => Promise<void>) => hooks.refresh.push(fn),
  onReachBottom: (fn: () => unknown) => hooks.bottom.push(fn),
  onShow: (fn: () => Promise<void>) => hooks.show.push(fn),
}))

beforeEach(() => {
  hooks.refresh = []
  hooks.bottom = []
  hooks.show = []
  uni.stopPullDownRefresh = vi.fn()
})

describe('列表生命周期', () => {
  it('非活跃 Tab 不得提前结束活跃 Tab 的下拉刷新动画', async () => {
    let resolve!: () => void
    useInfiniteListPage({
      fetchNextPage: vi.fn(),
      refetch: () =>
        new Promise<void>((done) => {
          resolve = done
        }),
    })
    const inactiveRefetch = vi.fn()
    useInfiniteListPage({ fetchNextPage: vi.fn(), refetch: inactiveRefetch, enabled: () => false })
    const refreshes = hooks.refresh.map((fn) => fn())
    await Promise.resolve()
    expect(uni.stopPullDownRefresh).not.toHaveBeenCalled()
    expect(inactiveRefetch).not.toHaveBeenCalled()
    resolve()
    await Promise.all(refreshes)
    expect(uni.stopPullDownRefresh).toHaveBeenCalledTimes(1)
  })

  it('刷新失败也会结束动画且不产生未处理异常', async () => {
    useInfiniteListPage({
      fetchNextPage: vi.fn(),
      refetch: vi.fn().mockRejectedValue(new Error('offline')),
    })
    await expect(hooks.refresh[0]()).resolves.toBeUndefined()
    expect(uni.stopPullDownRefresh).toHaveBeenCalledTimes(1)
  })

  it('滚动容器和页面触底都不能重复翻页或打断后台刷新', () => {
    const fetchNextPage = vi.fn()
    const isFetching = ref(true)
    const hasNextPage = ref(true)
    const { loadMore } = useInfiniteListPage({
      fetchNextPage,
      refetch: vi.fn(),
      isFetching,
      hasNextPage,
    })
    loadMore()
    hooks.bottom[0]()
    expect(fetchNextPage).not.toHaveBeenCalled()
    isFetching.value = false
    loadMore()
    expect(fetchNextPage).toHaveBeenCalledTimes(1)
    hasNextPage.value = false
    loadMore()
    expect(fetchNextPage).toHaveBeenCalledTimes(1)
  })

  it('恢复页面请求失败不会泄漏未处理异常', async () => {
    useInfiniteListPage({
      fetchNextPage: vi.fn(),
      refetch: vi.fn().mockRejectedValue(new Error('offline')),
      isStale: ref(true),
    })
    await expect(hooks.show[0]()).resolves.toBeUndefined()
  })

  it('缓存 Tab 再次显示时恢复过期查询，缓存新鲜时不重复请求', () => {
    const refetch = vi.fn()
    const isStale = ref(false)
    useInfiniteListPage({ fetchNextPage: vi.fn(), refetch, isStale, isFetching: ref(false) })
    hooks.show[0]()
    expect(refetch).not.toHaveBeenCalled()
    isStale.value = true
    hooks.show[0]()
    expect(refetch).toHaveBeenCalledTimes(1)
  })
})
