import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { useDebounceFn, useTimer } from './useTimer'

function mountComposable<T>(composableFn: () => T) {
  let result!: T
  const wrapper = mount(defineComponent({
    setup() {
      result = composableFn()
      return () => h('div')
    },
  }))

  return { result, wrapper }
}

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('clears pending timeouts when scope is disposed', () => {
    const fn = vi.fn()
    const { result, wrapper } = mountComposable(() => useTimer())

    result.setTimeout(fn, 100)
    wrapper.unmount()
    vi.advanceTimersByTime(100)

    expect(fn).not.toHaveBeenCalled()
  })

  it('clears intervals when scope is disposed', () => {
    const fn = vi.fn()
    const { result, wrapper } = mountComposable(() => useTimer())

    result.setInterval(fn, 100)
    vi.advanceTimersByTime(250)
    expect(fn).toHaveBeenCalledTimes(2)

    wrapper.unmount()
    vi.advanceTimersByTime(250)

    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('cancels pending debounced calls when scope is disposed', () => {
    const fn = vi.fn()
    const { result, wrapper } = mountComposable(() => useDebounceFn(fn, 100))

    result('pending')
    wrapper.unmount()
    vi.advanceTimersByTime(100)

    expect(fn).not.toHaveBeenCalled()
  })
})
