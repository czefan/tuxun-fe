import { focusManager, onlineManager } from '@tanstack/vue-query'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/store/auth'
import { useUserStore } from '@/features/user/store/user'
import { getUserInfo } from '@/features/user/api'
import { ApiRequestError } from '@/service/request/error'
import { queryClient } from '@/service/query/client'
import { useAppLifecycle } from './use-app-lifecycle'

const hooks = vi.hoisted(() => ({
  launch: [] as Array<() => void>,
  show: [] as Array<() => void>,
  hide: [] as Array<() => void>,
}))
vi.mock('@dcloudio/uni-app', () => ({
  onLaunch: (fn: () => void) => hooks.launch.push(fn),
  onShow: (fn: () => void) => hooks.show.push(fn),
  onHide: (fn: () => void) => hooks.hide.push(fn),
}))
vi.mock('@/features/user/api', () => ({ getUserInfo: vi.fn() }))

const profile = {
  id: 1,
  netid: 'alice',
  username: 'alice',
  nickname: 'Alice',
  avatar: '',
  points: 0,
  level: 1 as const,
  isAdmin: false,
  nicknameEditsRemaining: 3,
  avatarEditsRemaining: 3,
}

let wrapper: ReturnType<typeof mount>

beforeEach(() => {
  hooks.launch = []
  hooks.show = []
  hooks.hide = []
  vi.mocked(getUserInfo).mockReset()
  vi.mocked(uni.getNetworkType).mockImplementation((options) => {
    options?.success?.({ networkType: 'wifi', errMsg: 'getNetworkType:ok' })
  })
  wrapper = mount(
    defineComponent({
      setup() {
        useAppLifecycle()
        return () => null
      },
    }),
  )
})

afterEach(async () => {
  wrapper.unmount()
  await flushPromises()
  queryClient.clear()
  onlineManager.setOnline(true)
  focusManager.setFocused(true)
})

describe('应用恢复与会话竞态', () => {
  it('冷启动和连续 onShow 共享一次尚未完成的会话校验', async () => {
    useUserStore().setUserInfo(profile)
    let resolve!: (value: typeof profile) => void
    vi.mocked(getUserInfo).mockReturnValue(
      new Promise((done) => {
        resolve = done
      }),
    )
    hooks.launch.forEach((fn) => fn())
    hooks.show.forEach((fn) => fn())
    hooks.show.forEach((fn) => fn())
    expect(getUserInfo).toHaveBeenCalledTimes(1)
    resolve(profile)
    await flushPromises()
  })

  it('识别 HTTP 200 携带业务 code 6 的过期会话', async () => {
    const user = useUserStore()
    user.setUserInfo(profile)
    vi.mocked(getUserInfo).mockRejectedValue(
      new ApiRequestError('未登录', { statusCode: 200, code: 6 }),
    )
    hooks.show.forEach((fn) => fn())
    await flushPromises()
    expect(user.isLoggedIn()).toBe(false)
    expect(user.userInfo).toBeNull()
  })

  it('退出后的旧校验响应不能重新登录用户', async () => {
    const user = useUserStore()
    user.setUserInfo(profile)
    let resolve!: (value: typeof profile) => void
    vi.mocked(getUserInfo).mockReturnValue(
      new Promise((done) => {
        resolve = done
      }),
    )
    hooks.show.forEach((fn) => fn())
    user.logout()
    resolve(profile)
    await flushPromises()
    expect(user.isLoggedIn()).toBe(false)
    expect(user.userInfo).toBeNull()
  })

  it('旧会话的过期响应不能清除后来建立的新会话', async () => {
    const user = useUserStore()
    user.setUserInfo(profile)
    let reject!: (reason: Error) => void
    vi.mocked(getUserInfo).mockReturnValue(
      new Promise((_resolve, fail) => {
        reject = fail
      }),
    )
    hooks.show.forEach((fn) => fn())
    useAuthStore().setSessionId('new-session')
    user.setUserInfo({ ...profile, id: 2 })
    reject(new ApiRequestError('未登录', { statusCode: 401 }))
    await flushPromises()
    expect(user.isLoggedIn()).toBe(true)
    expect(user.userInfo?.id).toBe(2)
  })

  it('回到前台时修正后台错过的网络状态，并通知查询恢复', async () => {
    hooks.hide.forEach((fn) => fn())
    expect(focusManager.isFocused()).toBe(false)
    onlineManager.setOnline(false)
    hooks.show.forEach((fn) => fn())
    await flushPromises()
    expect(onlineManager.isOnline()).toBe(true)
    expect(focusManager.isFocused()).toBe(true)
    expect(getUserInfo).not.toHaveBeenCalled()
  })
})
