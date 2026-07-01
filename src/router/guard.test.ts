import { beforeEach, describe, expect, it } from 'vitest'
import { useUserStore } from '@/store/user'
import { EXCLUDE_LOGIN_PATH_LIST, LOGIN_PAGE } from './auth'
import { navigateToInterceptor } from './guard'
import { AppRoute } from './routes'

const originalExcludeLength = EXCLUDE_LOGIN_PATH_LIST.length

function setCurrentRoute(route: string) {
  vi.mocked(getCurrentPages).mockReturnValue([
    {
      route,
      $page: { fullPath: route },
    },
  ] as any)
}

function guardPath(path: string) {
  if (!EXCLUDE_LOGIN_PATH_LIST.includes(path)) {
    EXCLUDE_LOGIN_PATH_LIST.push(path)
  }
}

function getRedirectTarget() {
  const call = vi.mocked(uni.navigateTo).mock.calls.at(-1)
  const url = call?.[0]?.url ?? ''
  const redirect = url.split('redirect=')[1] ?? ''

  return decodeURIComponent(redirect)
}

describe('navigateToInterceptor', () => {
  beforeEach(() => {
    EXCLUDE_LOGIN_PATH_LIST.splice(originalExcludeLength)
    setCurrentRoute('/pages/index/index')
  })

  it('allows public routes when user is not logged in', () => {
    const result = navigateToInterceptor.invoke({ url: AppRoute.Home })

    expect(result).toBe(true)
    expect(uni.navigateTo).not.toHaveBeenCalled()
  })

  it('redirects guarded routes to login and preserves encoded query', () => {
    guardPath(AppRoute.MyPoints)

    const result = navigateToInterceptor.invoke({
      url: `${AppRoute.MyPoints}?keyword=图寻`,
      query: { space: 'a b' },
    })

    expect(result).toBe(false)
    expect(uni.navigateTo).toHaveBeenCalledWith({
      url: expect.stringContaining(`${LOGIN_PAGE}?redirect=`),
    })
    expect(getRedirectTarget()).toBe(`${AppRoute.MyPoints}?keyword=%E5%9B%BE%E5%AF%BB&space=a%20b`)
  })

  it('resolves relative guarded paths before redirecting', () => {
    setCurrentRoute('subPages/my/answers')
    guardPath(AppRoute.MyHelp)

    const result = navigateToInterceptor.invoke({ url: '../my/help?from=我的' })

    expect(result).toBe(false)
    expect(getRedirectTarget()).toBe(`${AppRoute.MyHelp}?from=%E6%88%91%E7%9A%84`)
  })

  it('redirects logged-in users away from login page', () => {
    const userStore = useUserStore()
    userStore.setToken('token')

    const result = navigateToInterceptor.invoke({
      url: `${LOGIN_PAGE}?redirect=${encodeURIComponent(AppRoute.Notice)}`,
    })

    expect(result).toBe(false)
    expect(uni.switchTab).toHaveBeenCalledWith({ url: AppRoute.Notice })
  })
})
