import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useUserStore } from './user'
import { StorageKey } from '@/constants'
import { QueryObserver } from '@tanstack/vue-query'
import { flushPromises } from '@vue/test-utils'
import { queryClient } from '@/service/query/client'
import { useAuthStore } from '@/store/auth'

describe('登出清理', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('登出必须清掉答题草稿与投稿草稿——共用设备时会泄露作答坐标与投稿数据', () => {
    const getStorageInfoSync = uni.getStorageInfoSync as unknown as ReturnType<typeof vi.fn>
    const removeStorageSync = uni.removeStorageSync as unknown as ReturnType<typeof vi.fn>

    getStorageInfoSync.mockReturnValue({
      keys: ['tuxun_submit_attempt_draft_1', 'tuxun_submit_attempt_draft_2', 'unrelated_key'],
      currentSize: 0,
      limitSize: 0,
    })

    useUserStore().logout()

    const removed = removeStorageSync.mock.calls.map((call) => call[0])
    expect(removed, '答题草稿没有被清理').toContain('tuxun_submit_attempt_draft_1')
    expect(removed).toContain('tuxun_submit_attempt_draft_2')
    // 投稿草稿与鉴权键一并清理
    expect(removed).toContain(StorageKey.ContributeDraft)
    expect(removed).toContain(StorageKey.Token)
    // 不相干的键不能误删
    expect(removed).not.toContain('unrelated_key')
  })

  it('会话失效后保留活跃查询的订阅，并自动重新加载游客列表', async () => {
    const user = useUserStore()
    const auth = useAuthStore()
    auth.setSession(true)
    const queryFn = vi.fn(async () => (auth.isLoggedIn ? ['member'] : ['guest']))
    const observer = new QueryObserver(queryClient, { queryKey: ['session-recovery'], queryFn })
    const unsubscribe = observer.subscribe(() => {})
    try {
      await flushPromises()
      expect(observer.getCurrentResult().data).toEqual(['member'])
      user.logout()
      await flushPromises()
      expect(observer.getCurrentResult().data).toEqual(['guest'])
      expect(queryFn).toHaveBeenCalledTimes(2)
    } finally {
      unsubscribe()
      queryClient.clear()
    }
  })

  it('请求层清除会话时同时清理用户资料和私有查询数据', async () => {
    const user = useUserStore()
    user.setUserInfo({
      id: 1,
      netid: 'alice',
      username: 'alice',
      nickname: '旧用户',
      avatar: '',
      points: 0,
      level: 1,
      isAdmin: false,
      nicknameEditsRemaining: 3,
      avatarEditsRemaining: 3,
    })
    queryClient.setQueryData(['private-record'], ['private'])
    useAuthStore().clearToken()
    await flushPromises()
    expect(user.userInfo).toBeNull()
    expect(queryClient.getQueryData(['private-record'])).toBeUndefined()
    queryClient.clear()
  })

  it('首页首屏请求尚未返回时登录失效，也能恢复加载而不是一直 pending', async () => {
    const user = useUserStore()
    useAuthStore().setSession(true)
    let resolveOld!: (data: string[]) => void
    const queryFn = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<string[]>((resolve) => {
            resolveOld = resolve
          }),
      )
      .mockResolvedValue(['guest'])
    const observer = new QueryObserver(queryClient, { queryKey: ['home-pending'], queryFn })
    const unsubscribe = observer.subscribe(() => {})
    try {
      expect(observer.getCurrentResult().isPending).toBe(true)
      user.logout()
      await flushPromises()
      resolveOld(['expired-member'])
      await flushPromises()
      expect(observer.getCurrentResult().data).toEqual(['guest'])
      expect(observer.getCurrentResult().isPending).toBe(false)
    } finally {
      unsubscribe()
      queryClient.clear()
    }
  })
})
