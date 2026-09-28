import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getPhotos } from '../api'
import PhotoFeed from './photo-feed.vue'
import PhotoWaterfall from './photo-waterfall.vue'
import { useViewTransition } from '@/composables/use-view-transition'

vi.mock('@dcloudio/uni-app', () => ({
  onShow: vi.fn(),
  onPullDownRefresh: vi.fn(),
  onReachBottom: vi.fn(),
}))
vi.mock('../api', () => ({ getPhotos: vi.fn().mockResolvedValue({ list: [], total: 0 }) }))
vi.mock('@/composables/use-sticky-top', () => ({
  useStickyTop: () => ({}),
  usePopupTopPadding: () => ({}),
}))
const navigate = vi.fn().mockResolvedValue(undefined)
vi.mock('@/composables/use-view-transition', () => ({
  useViewTransition: () => ({ navigateWithTransition: navigate }),
}))

let client: QueryClient
let wrapper: ReturnType<typeof mount>
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
})
afterEach(() => {
  wrapper?.unmount()
  client.clear()
  vi.useRealTimers()
})

function mountFeed(props = {}) {
  wrapper = mount(PhotoFeed, {
    props,
    global: {
      plugins: [[VueQueryPlugin, { queryClient: client }]],
      stubs: {
        PhotoWaterfall: true,
        'wd-search': {
          name: 'SearchStub',
          props: ['modelValue'],
          emits: ['update:modelValue'],
          template: '<input />',
        },
      },
    },
  })
  return wrapper
}

describe('共用题目列表', () => {
  it('连续输入合并为一次搜索，清空输入取消尚未发送的关键词', async () => {
    vi.useFakeTimers()
    mountFeed({ activityStatus: 'active' })
    await flushPromises()
    // 通过公开组件事件模拟输入，避免依赖 script setup 内部状态。
    const searchVm = wrapper.findComponent({ name: 'SearchStub' }).vm
    searchVm.$emit('update:modelValue', '校')
    await wrapper.vm.$nextTick()
    await vi.advanceTimersByTimeAsync(100)
    searchVm.$emit('update:modelValue', '校园 ')
    await wrapper.vm.$nextTick()
    await vi.advanceTimersByTimeAsync(300)
    expect(getPhotos).toHaveBeenCalledTimes(2)
    expect(getPhotos).toHaveBeenLastCalledWith(
      expect.objectContaining({ keyword: '校园', activity_status: 'active' }),
    )
    searchVm.$emit('update:modelValue', '尚未发送')
    await wrapper.vm.$nextTick()
    searchVm.$emit('update:modelValue', '')
    await wrapper.vm.$nextTick()
    await vi.advanceTimersByTimeAsync(400)
    expect(vi.mocked(getPhotos).mock.calls.some(([params]) => params?.keyword === '尚未发送')).toBe(
      false,
    )
  })

  it('活动页只请求指定活动，打开题目时保留筛选上下文', async () => {
    mountFeed({ activityId: 7 })
    await flushPromises()
    expect(getPhotos).toHaveBeenCalledWith(expect.objectContaining({ activity_id: 7 }))
    wrapper.findComponent(PhotoWaterfall).vm.$emit('open', { id: 10 })
    await flushPromises()
    expect(useViewTransition().navigateWithTransition).toHaveBeenCalledWith(
      expect.stringMatching(/activity_id=7/),
      expect.any(Function),
    )
  })
})
