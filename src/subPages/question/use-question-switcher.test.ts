import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { qk } from '@/service/query/keys'
import { useQuestionSwitcher } from './use-question-switcher'

const hooks = vi.hoisted(() => ({ unload: () => {} }))
vi.mock('@dcloudio/uni-app', () => ({
  onUnload: (fn: () => void) => {
    hooks.unload = fn
  },
}))
afterEach(() => vi.useRealTimers())

describe('切题导航生命周期', () => {
  it.each(['unload', 'unmount'])('页面 %s 后不得执行延迟跳转', (exit) => {
    vi.useFakeTimers()
    const client = new QueryClient()
    client.setQueryData(qk.photo.list(), { pages: [{ list: [{ id: 1 }, { id: 2 }] }] })
    let switcher!: ReturnType<typeof useQuestionSwitcher>
    const wrapper = mount(
      defineComponent({
        setup() {
          switcher = useQuestionSwitcher(ref(1))
          return () => null
        },
      }),
      { global: { plugins: [[VueQueryPlugin, { queryClient: client }]] } },
    )
    switcher.switchQuestion(1)
    if (exit === 'unload') hooks.unload()
    else wrapper.unmount()
    vi.advanceTimersByTime(300)
    expect(uni.redirectTo).not.toHaveBeenCalled()
    if (exit === 'unload') wrapper.unmount()
    client.clear()
  })
})
