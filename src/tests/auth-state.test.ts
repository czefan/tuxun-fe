import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth as useSharedAuth } from '@/composables/use-auth'
import * as userApi from '@/features/user/api'
import { useAuth as useUserAuth } from '@/features/user/composables/use-auth'
import { useUserStore } from '@/features/user/store/user'
import { useAuthStore } from '@/store/auth'

const PROFILE = {
  id: 1,
  netid: 'netid1',
  username: 'alice',
  nickname: 'Alice',
  avatar: '',
  points: 0,
  level: 1 as const,
  isAdmin: false,
  nicknameEditsRemaining: 3,
  avatarEditsRemaining: 3,
}

/**
 * 会话态拆分后，登录态有两条读取路径：
 * 基础设施层走 `@/composables/use-auth`（router/guard、点赞评论组件都用它），
 * 业务域走 `@/features/user/composables/use-auth`。
 *
 * 本项目是 **cookie 会话**，登录流程从头到尾不下发 token。
 * 如果基础设施层只判 `!!token`，它在生产里恒为 false——
 * 路由守卫会把已登录用户一直踢去登录页，点赞/评论一点就跳登录。
 */
describe('登录态一致性', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('cookie 会话登录（只有个人信息、没有 token）后，两条路径都必须认为已登录，且 isMe 结论一致', () => {
    expect(useSharedAuth().isLoggedIn()).toBe(false)

    useUserStore().setUserInfo(PROFILE)

    expect(useAuthStore().token, '本项目 cookie 会话不下发 token').toBe('')
    expect(useAuthStore().userId).toBe(PROFILE.id)
    expect(useUserStore().userInfo?.id).toBe(PROFILE.id)

    expect(
      useSharedAuth().isLoggedIn(),
      '基础设施层认为未登录：路由守卫会把已登录用户踢去登录页，点赞/评论也会一点就跳登录',
    ).toBe(true)
    expect(useUserAuth().isLoggedIn(), '业务域与基础设施层的登录判断不一致').toBe(true)

    expect(useSharedAuth().isMe(PROFILE.id)).toBe(true)
    expect(useUserAuth().isMe(PROFILE.id)).toBe(true)
  })

  it('登出后两条路径都必须恢复未登录', () => {
    const userStore = useUserStore()
    userStore.setUserInfo(PROFILE)
    userStore.logout()

    expect(useSharedAuth().isLoggedIn()).toBe(false)
    expect(useUserAuth().isLoggedIn()).toBe(false)
    expect(useAuthStore().userId).toBeNull()
    expect(useUserStore().userInfo).toBeNull()
  })

  it('下发 token 的场景同样算已登录', () => {
    useAuthStore().setToken('t')
    expect(useSharedAuth().isLoggedIn()).toBe(true)
  })

  it('登录失败或重置后，isLoggedIn 必须为 false 且 store 状态完全清空', () => {
    const userStore = useUserStore()
    const authStore = useAuthStore()

    authStore.setSessionId('stale_session_id')
    userStore.logout()

    expect(useSharedAuth().isLoggedIn()).toBe(false)
    expect(useUserAuth().isLoggedIn()).toBe(false)
    expect(authStore.hasSession).toBe(false)
    expect(authStore.sessionId).toBe('')
    expect(userStore.userInfo).toBeNull()
  })

  it('服务端登出失败 (logoutApi 抛错) 时，本地状态仍必须完全清空且 logout 不得抛出异常', async () => {
    const userStore = useUserStore()
    userStore.setUserInfo(PROFILE)

    const logoutSpy = vi.spyOn(userApi, 'logout').mockRejectedValueOnce(new Error('Network error'))

    const result = await useUserAuth().logout()

    expect(result).toEqual({ serverCleared: false })
    expect(useSharedAuth().isLoggedIn()).toBe(false)
    expect(useUserAuth().isLoggedIn()).toBe(false)
    expect(userStore.userInfo).toBeNull()
    expect(logoutSpy).toHaveBeenCalledTimes(1)

    logoutSpy.mockRestore()
  })
})
