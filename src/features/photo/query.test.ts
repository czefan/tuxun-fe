import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { qk } from '@/service/query/keys'
import type { PhotoCardVM, PhotoQueryParams } from './types'

const getPhotos = vi.fn(async (_params?: unknown) => ({ list: [], total: 0 }))

vi.mock('./api', () => ({
  getPhotos: (params: unknown) => getPhotos(params as never),
  getPhotoDetail: vi.fn(async () => ({})),
  setPhotoLike: vi.fn(async () => ({ liked: true })),
}))

const { useInfinitePhotoList, findAdjacentPhotoId, findCachedPhotoCard } = await import('./query')

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

describe('findAdjacentPhotoId', () => {
  it('匹配指定筛选条件的缓存并推算下一题与上一题', () => {
    const queryClient = new QueryClient()
    const mockPhotos = [
      { id: 101, title: 'Photo 101' },
      { id: 102, title: 'Photo 102' },
      { id: 103, title: 'Photo 103' },
    ] as PhotoCardVM[]

    queryClient.setQueryData([...qk.photo.list({ activity_id: 1, sort_by: 'hot' }), true], {
      pages: [{ list: mockPhotos, total: 3 }],
      pageParams: [1],
    })

    // 中间题目：下一题 103，上一题 101
    expect(findAdjacentPhotoId(queryClient, { activity_id: 1, sort_by: 'hot' }, 102, 1)).toBe(103)
    expect(findAdjacentPhotoId(queryClient, { activity_id: 1, sort_by: 'hot' }, 102, -1)).toBe(101)

    // 首题无上一题，末题无下一题
    expect(findAdjacentPhotoId(queryClient, { activity_id: 1, sort_by: 'hot' }, 101, -1)).toBeNull()
    expect(findAdjacentPhotoId(queryClient, { activity_id: 1, sort_by: 'hot' }, 103, 1)).toBeNull()
  })

  it('来源列表已到末尾时不得跳入另一筛选列表', () => {
    const client = new QueryClient()
    client.setQueryData(qk.photo.list({ activity_id: 1 }), {
      pages: [{ list: [{ id: 1 }, { id: 2 }] }],
    })
    client.setQueryData(qk.photo.list({ activity_id: 2 }), {
      pages: [{ list: [{ id: 2 }, { id: 3 }] }],
    })
    expect(findAdjacentPhotoId(client, { activity_id: 1 }, 2, 1)).toBeNull()
    client.clear()
  })

  it('条件未命中时回退到包含当前题目的通用列表缓存', () => {
    const queryClient = new QueryClient()
    const mockPhotos = [
      { id: 201, title: 'Photo 201' },
      { id: 202, title: 'Photo 202' },
    ] as PhotoCardVM[]

    queryClient.setQueryData([...qk.photo.list({ sort_by: 'created_at' }), false], {
      pages: [{ list: mockPhotos, total: 2 }],
      pageParams: [1],
    })

    // 传入未完全吻合的 params 或 null，依然能够从现有 photo 缓存中定位相邻题
    expect(findAdjacentPhotoId(queryClient, { keyword: 'unknown' }, 201, 1)).toBe(202)
    expect(findAdjacentPhotoId(queryClient, null, 202, -1)).toBe(201)
  })

  it('缓存中不存在题目时返回 null', () => {
    const queryClient = new QueryClient()
    expect(findAdjacentPhotoId(queryClient, null, 9999, 1)).toBeNull()
  })
})

describe('findCachedPhotoCard', () => {
  it('从列表缓存中查找并返回指定 ID 的 PhotoCardVM 快照', () => {
    const queryClient = new QueryClient()
    const mockCard = {
      id: 301,
      title: 'Photo 301',
      image: {
        url: 'https://img.example.com/thumb.jpg',
        originUrl: 'https://img.example.com/origin.jpg',
        width: 1080,
        height: 720,
      },
      author: { id: 1, nickname: 'Alice', avatar: '' },
      likesCount: 5,
      liked: false,
      solved: true,
      createdAt: '2026-08-01',
    } as PhotoCardVM

    queryClient.setQueryData([...qk.photo.list({ sort_by: 'hot' }), true], {
      pages: [{ list: [mockCard], total: 1 }],
      pageParams: [1],
    })

    const found = findCachedPhotoCard(queryClient, 301)
    expect(found).toEqual(mockCard)
  })

  it('未命中或 ID 为 0 时返回 null', () => {
    const queryClient = new QueryClient()
    expect(findCachedPhotoCard(queryClient, 0)).toBeNull()
    expect(findCachedPhotoCard(queryClient, 999)).toBeNull()
  })
})
