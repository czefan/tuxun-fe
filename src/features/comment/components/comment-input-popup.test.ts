import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import CommentInputPopup from './comment-input-popup.vue'

afterEach(() => vi.useRealTimers())
const options = {
  props: { visible: false },
  global: { stubs: { 'wd-popup': { template: '<div><slot /></div>' } } },
}

describe('评论输入弹窗生命周期', () => {
  it('快速关闭后不再触发延迟聚焦', async () => {
    vi.useFakeTimers()
    const wrapper = mount(CommentInputPopup, options)
    await wrapper.setProps({ visible: true })
    await wrapper.setProps({ visible: false })
    vi.advanceTimersByTime(100)
    await nextTick()
    expect((wrapper.vm as unknown as { isFocus: boolean }).isFocus).toBe(false)
    wrapper.unmount()
  })

  it('卸载时清理聚焦与失焦定时器', async () => {
    vi.useFakeTimers()
    const wrapper = mount(CommentInputPopup, options)
    await wrapper.setProps({ visible: true })
    await wrapper.find('textarea').trigger('blur')
    wrapper.unmount()
    vi.advanceTimersByTime(200)
    await nextTick()
    expect(wrapper.emitted('update:visible')).toBeUndefined()
    expect(vi.getTimerCount()).toBe(0)
  })
})
