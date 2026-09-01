import type { AppRoutePath } from '@/router/routes'
import { AppRoute } from '@/router/routes'

interface MenuItem {
  title: string
  route: AppRoutePath
  icon: string
  color: string
}

interface MenuGroup {
  title: string
  items: MenuItem[]
}

export const MENU_GROUPS: MenuGroup[] = [
  {
    title: '活动',
    items: [
      {
        title: '我的投稿',
        route: AppRoute.MyContributions,
        icon: 'i-carbon:camera',
        color: 'bg-amber-500/10 text-amber-600',
      },
      {
        title: '我的答题',
        route: AppRoute.MyAnswers,
        icon: 'i-carbon:task',
        color: 'bg-emerald-500/10 text-emerald-600',
      },
    ],
  },
  {
    title: '积分',
    items: [
      {
        title: '积分明细',
        route: AppRoute.MyPoints,
        icon: 'i-carbon:currency-dollar',
        color: 'bg-indigo-500/10 text-indigo-600',
      },
      {
        title: '积分商城',
        route: AppRoute.Mall,
        icon: 'i-carbon:store',
        color: 'bg-purple-500/10 text-purple-600',
      },
    ],
  },
  {
    title: '更多',
    items: [
      {
        title: '帮助中心',
        route: AppRoute.MyHelp,
        icon: 'i-carbon:help',
        color: 'bg-teal-500/10 text-teal-600',
      },
      {
        title: '意见反馈',
        route: AppRoute.MyFeedback,
        icon: 'i-carbon:chat',
        color: 'bg-blue-500/10 text-blue-600',
      },
      {
        title: '关于我们',
        route: AppRoute.MyAbout,
        icon: 'i-carbon:information',
        color: 'bg-rose-500/10 text-rose-600',
      },
    ],
  },
]
