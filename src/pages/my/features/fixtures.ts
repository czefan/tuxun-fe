import type { MyMenuGroup } from './types'
import { AppRoute } from '@/router/routes'

export function getMyMenuGroups(points: number): MyMenuGroup[] {
  return [
    {
      label: '积分',
      items: [
        {
          title: '积分明细',
          desc: '查看积分获取与兑换记录',
          icon: 'file',
          color: '#5ec7d3',
          value: `${points}`,
          path: AppRoute.MyPoints,
          requiresLogin: false,
        },
        {
          title: '积分商城',
          desc: '兑换钥匙扣、小卡片等周边',
          icon: 'store',
          color: '#d4a017',
          value: '兑换',
          path: AppRoute.Mall,
          requiresLogin: false,
        },
      ],
    },
    {
      label: '活动',
      items: [
        {
          title: '答题记录',
          desc: '按题目查看我的作答状态',
          icon: 'file',
          color: '#42a661',
          value: '',
          path: AppRoute.MyAnswers,
          requiresLogin: false,
        },
        {
          title: '投稿记录',
          desc: '查看我的题目投稿状态',
          icon: 'share-alt',
          color: '#d46b27',
          value: '',
          path: AppRoute.MyContributions,
          requiresLogin: false,
        },
      ],
    },
    {
      label: '更多',
      items: [
        {
          title: '帮助中心',
          desc: '玩法规则、积分规则与安全提示',
          icon: 'question-circle',
          color: '#7b6fd6',
          value: '',
          path: AppRoute.MyHelp,
          requiresLogin: false,
        },
        {
          title: '反馈',
          desc: '提交问题、建议或异常信息',
          icon: 'edit',
          color: '#d96a78',
          value: '',
          path: AppRoute.MyFeedback,
          requiresLogin: false,
        },
        {
          title: '关于我们',
          desc: '图寻项目及开发团队介绍',
          icon: 'info-circle',
          color: '#5f8f62',
          value: '',
          path: AppRoute.MyAbout,
          requiresLogin: false,
        },
      ],
    },
  ]
}
