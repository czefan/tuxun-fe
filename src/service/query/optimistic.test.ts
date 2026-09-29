import { QueryClient } from '@tanstack/vue-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/store/auth'
import { beginOptimisticUpdate } from './optimistic'

const client = new QueryClient()
const key = ['test', 'profile']
afterEach(() => client.clear())

describe('乐观回滚', () => {
  it('独立失败恢复旧值并重新校准缓存', async () => {
    client.setQueryData(key, { name: 'old' })
    const finish = await beginOptimisticUpdate(client, { queryKey: key })
    client.setQueryData(key, { name: 'new' })
    finish().rollback()
    expect(client.getQueryData(key)).toEqual({ name: 'old' })
    expect(client.getQueryState(key)?.isInvalidated).toBe(true)
  })

  it('失败不能覆盖之后成功操作写入的数据', async () => {
    client.setQueryData(key, { name: 'old', avatar: 'old' })
    const finish = await beginOptimisticUpdate(client, { queryKey: key })
    client.setQueryData(key, { name: 'optimistic', avatar: 'old' })
    const ctx = finish()
    client.setQueryData(key, { name: 'optimistic', avatar: 'new' })
    ctx.rollback()
    expect(client.getQueryData(key)).toEqual({ name: 'optimistic', avatar: 'new' })
    expect(client.getQueryState(key)?.isInvalidated).toBe(true)
  })

  it('换账号后旧失败不能恢复上个用户数据', async () => {
    client.setQueryData(key, { name: 'user-a' })
    const finish = await beginOptimisticUpdate(client, { queryKey: key })
    client.setQueryData(key, { name: 'edit-a' })
    const ctx = finish()
    useAuthStore().clearToken()
    client.setQueryData(key, { name: 'user-b' })
    ctx.rollback()
    expect(client.getQueryData(key)).toEqual({ name: 'user-b' })
    expect(client.getQueryState(key)?.isInvalidated).toBe(false)
  })

  it('取消查询期间会话变更，中止旧操作', async () => {
    const spy = vi.spyOn(client, 'cancelQueries').mockImplementationOnce(async () => {
      useAuthStore().clearToken()
    })
    await expect(beginOptimisticUpdate(client, {})).rejects.toThrow('会话已变化')
    spy.mockRestore()
  })
})
