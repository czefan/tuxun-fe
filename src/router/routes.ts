import { withQuery as ufoWithQuery } from 'ufo'

export const AppRoute = {
  Home: '/pages/index/index',
  ActivityList: '/pages/activity/index',
  Notice: '/pages/notice/index',
  My: '/pages/my/index',

  Activity: '/subPages/activity/index',
  AuthCallback: '/subPages/auth/callback',
  AuthWebview: '/subPages/auth/webview',
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

export type RouteQueryValue = string | number | boolean | null | undefined

export function withQuery(path: AppRoutePath, query: Record<string, RouteQueryValue>) {
  const cleaned = Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  )
  return ufoWithQuery(path, cleaned)
}
