import { ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { resolveEnabled } from './enabled'

describe('resolveEnabled', () => {
  it('未传入 enabled 时，直接取决于 extra 条件', () => {
    const isReady = ref(true)
    const enabled = resolveEnabled(isReady)
    expect(enabled.value).toBe(true)

    isReady.value = false
    expect(enabled.value).toBe(false)
  })

  it('当 extra 为 getter 函数时能正确响应依赖变化', () => {
    const loggedIn = ref(true)
    const enabled = resolveEnabled(() => loggedIn.value)
    expect(enabled.value).toBe(true)

    loggedIn.value = false
    expect(enabled.value).toBe(false)
  })

  it('当 enabled 传入 false 时，无论 extra 为何都输出 false', () => {
    const isReady = ref(true)
    const customEnabled = ref(false)
    const enabled = resolveEnabled(isReady, customEnabled)
    expect(enabled.value).toBe(false)

    isReady.value = false
    expect(enabled.value).toBe(false)

    customEnabled.value = true
    expect(enabled.value).toBe(false)

    isReady.value = true
    expect(enabled.value).toBe(true)
  })

  it('支持常量布尔值', () => {
    expect(resolveEnabled(true, true).value).toBe(true)
    expect(resolveEnabled(true, false).value).toBe(false)
    expect(resolveEnabled(false, true).value).toBe(false)
    expect(resolveEnabled(false, undefined).value).toBe(false)
  })
})
