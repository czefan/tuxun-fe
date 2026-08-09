import { VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PhotoQueryParams } from './types'

const getPhotos = vi.fn(async (_params?: unknown) => ({ list: [], total: 0 }))

vi.mock('./api', () => ({
  getPhotos: (params: unknown) => getPhotos(params as never),
  getPhotoDetail: vi.fn(async () => ({})),
  setPhotoLike: vi.fn(async () => ({ liked: true })),
}))

const { useInfinitePhotoList } = await import('./query')

describe('photo query keys', () => {
  beforeEach(() => {
    getPhotos.mockClear()
  })

  it('queryKey 必须保持响应式：参数变化要重新拉数据', async () => {
    const params = ref<PhotoQueryParams>({ sort_by: 'created_at' })

    mount(
      defineComponent({
        setup() {
          useInfinitePhotoList(params)
          return () => null
        },
      }),
      { global: { plugins: [VueQueryPlugin] } },
    )

    await flushPromises()
    expect(getPhotos).toHaveBeenCalledTimes(1)

    // 切换排序 —— 如果 queryKey 在 setup 时被 .value 取成了静态快照，
    // 这里不会触发任何新请求，列表会一直停在旧排序上
    params.value = { sort_by: 'hot' }
    await flushPromises()
    await flushPromises()

    expect(
      getPhotos.mock.calls.length,
      'queryKey 不再随参数变化：切换排序/搜索不会重新请求',
    ).toBeGreaterThan(1)
  })
})
