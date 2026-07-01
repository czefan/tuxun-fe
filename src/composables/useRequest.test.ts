import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import useRequest, { invalidateRequestCache } from './useRequest'

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })

  return { promise, resolve, reject }
}

/**
 * 在 Vue 应用上下文中运行 composable。
 * composable 的 ref/computed/onMounted 只能在 setup() 内使用，
 * withSetup 通过挂载一个临时组件来提供这个上下文。
 */
function withSetup<T>(composableFn: () => T): T {
  let result!: T
  const Comp = defineComponent({
    setup() {
      result = composableFn()
      return () => h('div')
    },
  })
  const wrapper = mount(Comp)
  wrapper.unmount()
  return result
}

describe('useRequest', () => {
  beforeEach(() => {
    invalidateRequestCache()
  })

  it('初始状态：loading=false, error=false, data=undefined', () => {
    const asyncFn = vi.fn().mockResolvedValue('data')
    const { loading, error, data } = withSetup(() => useRequest(asyncFn))

    expect(loading.value).toBe(false)
    expect(error.value).toBe(false)
    expect(data.value).toBeUndefined()
  })

  it('initialData：初始 data 使用传入的默认值', () => {
    const asyncFn = vi.fn().mockResolvedValue('new')
    const { data } = withSetup(() => useRequest(asyncFn, { initialData: 'init' }))

    expect(data.value).toBe('init')
  })

  it('run 成功：loading 先变 true 后变 false，data 更新为返回值', async () => {
    const asyncFn = vi.fn().mockResolvedValue('result')
    const { loading, data, run } = withSetup(() => useRequest(asyncFn))

    const runPromise = run()
    expect(loading.value).toBe(true)

    await runPromise

    expect(loading.value).toBe(false)
    expect(data.value).toBe('result')
    await expect(runPromise).resolves.toBe('result')
  })

  it('run 失败：抛出错误，error 被设置，loading 重置为 false', async () => {
    const err = new Error('network error')
    const asyncFn = vi.fn().mockRejectedValue(err)
    const { loading, error, run } = withSetup(() => useRequest(asyncFn))

    await expect(run()).rejects.toThrow('network error')

    expect(loading.value).toBe(false)
    expect(error.value).toBe(err)
  })

  it('immediate=true：组件挂载时立即调用异步函数并更新 data', async () => {
    const asyncFn = vi.fn().mockResolvedValue('eager')
    const { data } = withSetup(() => useRequest(asyncFn, { immediate: true }))

    expect(asyncFn).toHaveBeenCalledTimes(1)
    // 等待 Promise 完成
    await flushPromises()
    expect(data.value).toBe('eager')
  })

  it('defaultParams + refresh：复用上次请求参数', async () => {
    const asyncFn = vi.fn()
      .mockResolvedValueOnce('page-1')
      .mockResolvedValueOnce('page-2')
    const { data, run, refresh } = withSetup(() =>
      useRequest<string, { page: number }>(asyncFn, { defaultParams: { page: 1 } }),
    )

    await run()
    await refresh()

    expect(asyncFn).toHaveBeenNthCalledWith(1, { page: 1 })
    expect(asyncFn).toHaveBeenNthCalledWith(2, { page: 1 })
    expect(data.value).toBe('page-2')
  })

  it('mutate/reset：支持本地更新并恢复初始状态', async () => {
    const asyncFn = vi.fn().mockResolvedValue(2)
    const { data, mutate, reset, run } = withSetup(() => useRequest(asyncFn, { initialData: 1 }))

    mutate(current => (current ?? 0) + 1)
    expect(data.value).toBe(2)

    await run()
    expect(data.value).toBe(2)

    mutate(10)
    expect(data.value).toBe(10)

    reset()
    expect(data.value).toBe(1)
  })

  it('onSuccess/onError：只在最新请求落地时触发', async () => {
    const onSuccess = vi.fn()
    const onError = vi.fn()
    const asyncFn = vi.fn()
      .mockResolvedValueOnce('ok')
      .mockRejectedValueOnce(new Error('failed'))
    const { run } = withSetup(() => useRequest<string, string>(asyncFn, { onSuccess, onError }))

    await run('success')
    await expect(run('error')).rejects.toThrow('failed')

    expect(onSuccess).toHaveBeenCalledWith('ok', 'success')
    expect(onError).toHaveBeenCalledWith(expect.any(Error), 'error')
  })

  it('并发请求：较早请求后完成时不覆盖最新 data/loading', async () => {
    const first = createDeferred<string>()
    const second = createDeferred<string>()
    const asyncFn = vi.fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    const { loading, data, run } = withSetup(() => useRequest<string, string>(asyncFn))

    const firstRun = run('first')
    const secondRun = run('second')

    second.resolve('second-result')
    await secondRun

    expect(data.value).toBe('second-result')
    expect(loading.value).toBe(false)

    first.resolve('first-result')
    await firstRun

    expect(data.value).toBe('second-result')
    expect(loading.value).toBe(false)
  })

  it('cache：命中缓存时不重复执行请求函数', async () => {
    const asyncFn = vi.fn()
      .mockResolvedValueOnce('first')
      .mockResolvedValueOnce('second')
    const { run } = withSetup(() =>
      useRequest(asyncFn, { cache: { key: 'profile', cacheTime: 1000 } }),
    )

    await expect(run()).resolves.toBe('first')
    await expect(run()).resolves.toBe('first')

    expect(asyncFn).toHaveBeenCalledTimes(1)
  })

  it('cache：失效指定 key 后重新请求', async () => {
    const asyncFn = vi.fn()
      .mockResolvedValueOnce('first')
      .mockResolvedValueOnce('second')
    const { run } = withSetup(() =>
      useRequest(asyncFn, { cache: { key: 'profile', cacheTime: 1000 } }),
    )

    await run()
    invalidateRequestCache('profile')
    await expect(run()).resolves.toBe('second')

    expect(asyncFn).toHaveBeenCalledTimes(2)
  })

  it('cache：同 key 并发请求只执行一次', async () => {
    const deferred = createDeferred<string>()
    const asyncFn = vi.fn().mockReturnValue(deferred.promise)
    const { run } = withSetup(() =>
      useRequest<string, { id: number }>(asyncFn, {
        cache: { key: args => ['detail', args?.id], cacheTime: 1000 },
      }),
    )

    const firstRun = run({ id: 1 })
    const secondRun = run({ id: 1 })

    expect(asyncFn).toHaveBeenCalledTimes(1)

    deferred.resolve('detail')

    await expect(firstRun).resolves.toBe('detail')
    await expect(secondRun).resolves.toBe('detail')
  })
})
