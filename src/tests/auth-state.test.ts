import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth as useSharedAuth } from '@/composables/use-auth'
import * as userApi from '@/features/user/api'
import { useAuth as useUserAuth } from '@/features/user/composables/use-auth'
import { useUserStore } from '@/features/user/store/user'
import { useAuthStore } from '@/store/auth'
import { clearReturnPath, getLogoutUrl, takeReturnPath, validateAndClearState } from '@/service/auth/login'
import { relaunchMiniProgram } from '@/utils/mp-webview'

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

/**
 * OAuth2 state CSRF 防护校验。
 *
 * validateAndClearState 在 H5 端（jsdom）通过 sessionStorage 判断本次登录是否由本站发起：
 * - stored 为空 → 本端没发起过这次登录（非本站跳转），拒绝
 * - state 为空  → 回调没带 state（攻击者构造的裸回调），拒绝
 * - 两者不匹配 → 拒绝
 * - 完全匹配   → 放行并清除
 */
describe('oAuth2 state CSRF 防护', () => {
  beforeEach(() => {
    uni.removeStorageSync('oauth_state')
  })

  it('storage 无记录时（非本站发起的登录）必须拒绝，无论 state 是否存在', () => {
    expect(validateAndClearState('any-state')).toBe(false)
    expect(validateAndClearState('')).toBe(false)
  })

  it('state 为空串时必须拒绝（攻击者构造的不带 state 的裸回调）', () => {
    uni.setStorageSync('oauth_state', 'stored-state')
    expect(validateAndClearState('')).toBe(false)
    // 校验失败也必须清除，防止重放
    expect(uni.getStorageSync('oauth_state')).toBeFalsy()
  })

  it('state 与 storage 不匹配时必须拒绝', () => {
    uni.setStorageSync('oauth_state', 'stored-state')
    expect(validateAndClearState('tampered-state')).toBe(false)
    expect(uni.getStorageSync('oauth_state')).toBeFalsy()
  })

  it('state 与 storage 完全匹配时放行，且校验后立即清除', () => {
    uni.setStorageSync('oauth_state', 'correct-state')
    expect(validateAndClearState('correct-state')).toBe(true)
    expect(uni.getStorageSync('oauth_state')).toBeFalsy()
  })

  it('state 一次性使用：校验通过即作废，未重新发起授权时重放同一 state 必须拒绝', () => {
    uni.setStorageSync('oauth_state', 'one-time-state')
    expect(validateAndClearState('one-time-state')).toBe(true)
    // 校验后记录已被清除，不重新发起授权（不补写）的情况下重放必拒
    expect(validateAndClearState('one-time-state')).toBe(false)
  })
})

describe('takeReturnPath 回跳地址安全校验', () => {
  beforeEach(() => {
    uni.removeStorageSync('login_return_path')
  })

  it('无存储或不是字符串时返回空串', () => {
    expect(takeReturnPath()).toBe('')
  })

  it('只允许 /pages/ 或 /subPages/ 开头的站内路径', () => {
    uni.setStorageSync('login_return_path', '/subPages/question/detail?id=123')
    expect(takeReturnPath()).toBe('/subPages/question/detail?id=123')

    // 只能消费一次，再次调用应为空
    expect(takeReturnPath()).toBe('')
  })

  it('拒绝外部域名与非法相对路径 (开放重定向防护)', () => {
    const invalidPaths = [
      'https://evil.com',
      '//evil.com',
      '../subPages/question/detail',
      'javascript:alert(1)',
      '/other/path',
    ]

    for (const p of invalidPaths) {
      uni.setStorageSync('login_return_path', p)
      expect(takeReturnPath(), `路径 ${p} 应被拦截`).toBe('')
    }
  })
})

describe('getLogoutUrl 登出地址构建与降级', () => {
  it('配置完整时应拼接带 client_id 与 post_logout_redirect_uri 的登出 URL', () => {
    vi.stubEnv('VITE_OAUTH_BASE_URL', 'https://oauth.tiaozhan.com')
    vi.stubEnv('VITE_OAUTH_CLIENT_ID', 'test_client')

    const redirectUri = 'https://tuxun.tiaozhan.com/'
    const logoutUrl = getLogoutUrl(redirectUri)
    expect(logoutUrl).toBe(`https://oauth.tiaozhan.com/oauth2/logout?client_id=test_client&post_logout_redirect_uri=${encodeURIComponent(redirectUri)}`)

    vi.unstubAllEnvs()
  })

  it('未配置 OAuth 时降级返回空串，不弹错也不报错', () => {
    vi.stubEnv('VITE_OAUTH_BASE_URL', '')
    vi.stubEnv('VITE_OAUTH_CLIENT_ID', '')

    expect(getLogoutUrl('https://tuxun.tiaozhan.com/')).toBe('')

    vi.unstubAllEnvs()
  })
})

describe('clearReturnPath', () => {
  it('应清空 login_return_path', () => {
    uni.setStorageSync('login_return_path', '/pages/my/index')
    clearReturnPath()
    expect(uni.getStorageSync('login_return_path')).toBeFalsy()
  })
})

describe('relaunchMiniProgram', () => {
  it('非小程序环境下直接返回 false', async () => {
    const res = await relaunchMiniProgram()
    expect(res).toBe(false)
  })
})
