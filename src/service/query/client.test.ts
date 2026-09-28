import { focusManager, onlineManager, QueryObserver } from '@tanstack/vue-query'
import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiRequestError } from '@/service/request/error'
import { queryClient } from './client'

let unsubscribe: (() => void) | undefined
beforeEach(() => {
  queryClient.clear()
  queryClient.mount()
  onlineManager.setOnline(true)
  focusManager.setFocused(true)
})
afterEach(() => {
  unsubscribe?.()
  unsubscribe = undefined
  queryClient.unmount()
  queryClient.clear()
})

describe('查询自动恢复', () => {
  it('回到前台会重拉过期查询', async () => {
    const queryFn = vi.fn().mockResolvedValue(['photo'])
    const observer = new QueryObserver(queryClient, { queryKey: ['focus'], queryFn, staleTime: 0 })
    unsubscribe = observer.subscribe(() => {})
    await flushPromises()
    focusManager.setFocused(false)
    focusManager.setFocused(true)
    await flushPromises()
    expect(queryFn).toHaveBeenCalledTimes(2)
  })

  it('联网恢复会重试失败列表', async () => {
    const queryFn = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(['photo'])
    const observer = new QueryObserver(queryClient, {
      queryKey: ['reconnect'],
      queryFn,
      retry: false,
    })
    unsubscribe = observer.subscribe(() => {})
    await flushPromises()
    expect(observer.getCurrentResult().isError).toBe(true)
    onlineManager.setOnline(false)
    onlineManager.setOnline(true)
    await flushPromises()
    expect(observer.getCurrentResult().data).toEqual(['photo'])
  })

  it('短暂切到后台不重复加载仍然新鲜的缓存', async () => {
    const queryFn = vi.fn().mockResolvedValue(['photo'])
    const observer = new QueryObserver(queryClient, { queryKey: ['fresh'], queryFn })
    unsubscribe = observer.subscribe(() => {})
    await flushPromises()
    focusManager.setFocused(false)
    focusManager.setFocused(true)
    await flushPromises()
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('未登录错误不发起自动重试', async () => {
    const queryFn = vi
      .fn()
      .mockRejectedValue(new ApiRequestError('未登录', { statusCode: 200, code: 6 }))
    await expect(
      queryClient.fetchQuery({ queryKey: ['unauthorized'], queryFn }),
    ).rejects.toMatchObject({ code: 6 })
    expect(queryFn).toHaveBeenCalledTimes(1)
  })
})
