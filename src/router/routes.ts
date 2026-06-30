export const AppRoute = {
  Home: '/pages/index/index',
  History: '/pages/history/index',
  Notice: '/pages/notice/index',
  My: '/pages/my/index',

  Activity: '/subPages/activity/index',
  AuthLogin: '/subPages/auth/login',
  AuthCallback: '/subPages/auth/callback',
  Contribute: '/subPages/contribute/index',
  Mall: '/subPages/mall/index',
  NoticeDetail: '/subPages/notice/detail',
  QuestionDetail: '/subPages/question/detail',
  QuestionSubmit: '/subPages/question/submit',

  MyPoints: '/subPages/my/points',
  MyAnswers: '/subPages/my/answers',
  MyContributions: '/subPages/my/contributions',
  MyHelp: '/subPages/my/help',
  MyFeedback: '/subPages/my/feedback',
  MyAbout: '/subPages/my/about',
} as const

export type AppRoutePath = (typeof AppRoute)[keyof typeof AppRoute]

export const TabBarRoutes = [
  AppRoute.Home,
  AppRoute.History,
  AppRoute.Notice,
  AppRoute.My,
] as const

export type TabBarRoutePath = (typeof TabBarRoutes)[number]
export type RouteQueryValue = string | number | boolean | null | undefined

export function getRoutePath(url: string) {
  return url.split('?')[0] || url
}

export function isTabBarRoute(url: string) {
  return (TabBarRoutes as readonly string[]).includes(getRoutePath(url))
}

export function withQuery(path: AppRoutePath, query: Record<string, RouteQueryValue>) {
  const params = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)

  return params.length ? `${path}?${params.join('&')}` : path
}
