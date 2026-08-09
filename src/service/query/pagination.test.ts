import { describe, expect, it } from 'vitest'
import { nextPageByLoadedCount } from './pagination'

describe('nextPageByLoadedCount', () => {
  it('当实际累计加载条数小于 total 时，应该返回下一页页码', () => {
    const page1 = { list: [1, 2, 3], total: 10 }
    const page2 = { list: [4, 5, 6], total: 10 }

    expect(nextPageByLoadedCount(page1, [page1])).toBe(2)
    expect(nextPageByLoadedCount(page2, [page1, page2])).toBe(3)
  })

  it('即便后端因过滤导致某页不足 page_size，只要累计未达到 total 仍可继续翻页', () => {
    // 假设每页期望 20 条，但由于服务端过滤第 1 页仅返回 12 条，总条数 25
    const page1 = { list: Array.from({ length: 12 }), total: 25 }
    expect(nextPageByLoadedCount(page1, [page1])).toBe(2)
  })

  it('当实际累计条数达到或超过 total 时，应该返回 undefined 停止翻页', () => {
    const page1 = { list: Array.from({ length: 5 }), total: 5 }
    expect(nextPageByLoadedCount(page1, [page1])).toBeUndefined()
  })
})
