import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useUserStore } from '../store/user'
import { useAuth } from './use-auth'
import { useAuthStore } from '@/store/auth'
import { getUserInfo, loginCallback, logout } from '../api'
import type { LoginResultVM, UserInfo } from '../types'

vi.mock('../api', () => ({ getUserInfo: vi.fn(), loginCallback: vi.fn(), logout: vi.fn() }))

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}
const info = { id: 1, nickname: 'Alice' } as UserInfo
const login = { sessionId: 'session-a' } as LoginResultVM

describe('useAuth 响应式测试', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('userInfo 与 isLoggedIn 必须保持响应式，store 改变时引用联动更新', () => {
    const userStore = useUserStore()
    const { userInfo, isLoggedInRef } = useAuth()

    expect(isLoggedInRef.value).toBe(false)
    expect(userInfo.value).toBeNull()

    // 修改 store 状态
    userStore.setUserInfo({
      id: 1,
      username: 'alice',
      nickname: 'Alice',
      avatar: '',
      level: 1,
      points: 100,
      isAdmin: false,
      nicknameEditsRemaining: 3,
      avatarEditsRemaining: 3,
      netid: 'netid1',
    })

    expect(isLoggedInRef.value).toBe(true)
    expect(userInfo.value?.nickname).toBe('Alice')
  })
})

describe('登录与登出异步隔离', () => {
  it('换取凭据期间退出，迟到回调不得重新登录', async () => {
    const pending = deferred<LoginResultVM>()
    vi.mocked(loginCallback).mockReturnValueOnce(pending.promise)
    const result = useAuth().handleCallback('code', 'redirect')
    useUserStore().logout()
    pending.resolve(login)
    await expect(result).rejects.toThrow('已失效')
    expect(useAuthStore().isLoggedIn).toBe(false)
    expect(getUserInfo).not.toHaveBeenCalled()
  })

  it('获取资料期间退出，迟到资料不得恢复登录', async () => {
    vi.mocked(loginCallback).mockResolvedValueOnce(login)
    const pending = deferred<UserInfo>()
    vi.mocked(getUserInfo).mockReturnValueOnce(pending.promise)
    const result = useAuth().handleCallback('code', 'redirect')
    await vi.waitFor(() => expect(getUserInfo).toHaveBeenCalled())
    useUserStore().logout()
    pending.resolve(info)
    await expect(result).rejects.toThrow('已失效')
    expect(useUserStore().userInfo).toBeNull()
  })

  it('两个调用方同时登录，较早的结果不能覆盖新登录', async () => {
    const old = deferred<LoginResultVM>()
    vi.mocked(loginCallback)
      .mockReturnValueOnce(old.promise)
      .mockResolvedValueOnce({ sessionId: 'session-b' } as LoginResultVM)
    vi.mocked(getUserInfo).mockResolvedValueOnce({ ...info, id: 2 })
    const first = useAuth().handleCallback('old', 'redirect')
    await useAuth().handleCallback('new', 'redirect')
    old.resolve(login)
    await expect(first).rejects.toThrow('已失效')
    expect(useUserStore().userInfo?.id).toBe(2)
    expect(useAuthStore().sessionId).toBe('session-b')
  })

  it('旧登出完成不能清除新会话', async () => {
    useAuthStore().setSessionId('old')
    const pending = deferred<void>()
    vi.mocked(logout).mockReturnValueOnce(pending.promise)
    const result = useAuth().logout()
    useAuthStore().setSessionId('new')
    useUserStore().setUserInfo(info)
    pending.resolve()
    await expect(result).resolves.toEqual({ serverCleared: true, superseded: true })
    expect(useAuthStore().sessionId).toBe('new')
    expect(useUserStore().userInfo?.id).toBe(1)
  })

  it('用户资料加载失败时清除本次临时凭据', async () => {
    vi.mocked(loginCallback).mockResolvedValueOnce(login)
    vi.mocked(getUserInfo).mockRejectedValueOnce(new Error('offline'))
    await expect(useAuth().handleCallback('code', 'redirect')).rejects.toThrow('offline')
    expect(useAuthStore().isLoggedIn).toBe(false)
  })

  it('服务端登出失败仍清理本地会话', async () => {
    useUserStore().setUserInfo(info)
    vi.mocked(logout).mockRejectedValueOnce(new Error('offline'))
    await expect(useAuth().logout()).resolves.toEqual({ serverCleared: false })
    expect(useUserStore().userInfo).toBeNull()
    expect(useAuthStore().isLoggedIn).toBe(false)
  })
})
