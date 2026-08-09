import type { PageResult } from '@/service/contract/types'

/**
 * 按实际累计条数判断是否还有下一页。
 *
 * 不能假设每页恰好满 page_size —— 后端因审核/权限过滤返回不足一页时，
 * `page * size` 会高估已加载量，导致翻页提前停止、用户看不到后面的数据。
 */
export function nextPageByLoadedCount<T>(
  lastPage: PageResult<T>,
  allPages: PageResult<T>[],
): number | undefined {
  const loadedCount = allPages.reduce((sum, page) => sum + page.list.length, 0)
  return loadedCount < lastPage.total ? allPages.length + 1 : undefined
}
