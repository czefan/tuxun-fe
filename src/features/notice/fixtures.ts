import type { NoticeGroup } from './types'

export const noticeGroups: NoticeGroup[] = [
  {
    label: '今天',
    items: [
      {
        id: 9,
        title: '今日答题提醒',
        summary: '今日挑战已开放，完成答题可获得额外活动积分。',
        time: '10:00',
      },
    ],
  },
  {
    label: '昨天',
    items: [
      {
        id: 10,
        title: '昨日活动回顾',
        summary: '昨日新增题目已完成审核，可在当期活动中查看。',
        time: '18:30',
      },
    ],
  },
  {
    label: '本周',
    items: [
      {
        id: 7,
        title: '本周挑战更新',
        summary: '本周新增 6 道校园机位题目，完成答题可获得活动积分。',
        time: '6/6',
      },
      {
        id: 8,
        title: '系统维护提醒',
        summary: '本周日凌晨将进行短时维护，期间可能无法提交答题。',
        time: '6/5',
      },
    ],
  },
  {
    label: '上周',
    items: [
      {
        id: 1,
        title: '本期活动玩法说明',
        summary: '本期图寻已开放，请根据题目图片前往现场寻找相同机位并完成答题。',
        time: '5/20',
      },
      {
        id: 2,
        title: '评论区安全提醒',
        summary: '请勿在评论中泄露具体地点、GPS 坐标或直接答案。',
        time: '5/19',
      },
    ],
  },
  {
    label: '上月',
    items: [
      {
        id: 3,
        title: '积分商城兑换规则',
        summary: '钥匙扣、小卡片等周边将在活动结束后分批开放兑换。',
        time: '4/14',
      },
      {
        id: 4,
        title: '题目审核结果通知',
        summary: '你提交的校园机位题目已通过初步审核。',
        time: '4/4',
      },
    ],
  },
  {
    label: '更早',
    items: [
      {
        id: 5,
        title: '图寻试运行公告',
        summary: '试运行期间功能会持续调整，欢迎提交反馈。',
        time: '3/26',
      },
      {
        id: 6,
        title: '游客模式说明',
        summary: '未登录用户可以浏览题目、往期活动和商城内容。',
        time: '3/12',
      },
    ],
  },
]

export function getNoticeById(id: number) {
  return noticeGroups.flatMap(group => group.items).find(item => item.id === id)
}
