import { questionList } from '@/features/questions'
import type { AnswerQuestionRecord, ContributionRecord, PointLedgerItem } from './types'

export const pointLedgerList: PointLedgerItem[] = [
  { id: 1, score: 50, title: '完成机位解密', time: '2026-06-06 14:20' },
  { id: 2, score: 120, title: '发布题目通过审核', time: '2026-06-05 19:12' },
  { id: 3, score: -280, title: '兑换商品：图寻钥匙扣', time: '2026-06-01 11:08' },
]

export function getAnswerQuestionRecords(): AnswerQuestionRecord[] {
  const [first, second, third, fourth] = questionList

  return [
    {
      questionId: first.id,
      title: first.title,
      cover: first.cover,
      coverWidth: first.coverWidth,
      coverHeight: first.coverHeight,
      location: first.location,
      latestStatus: 'correct',
      latestTime: '今天 12:24',
      usedCount: 3,
      limitCount: 10,
      summary: '最近一次作答已通过',
    },
    {
      questionId: second.id,
      title: second.title,
      cover: second.cover,
      coverWidth: second.coverWidth,
      coverHeight: second.coverHeight,
      location: second.location,
      latestStatus: 'pending',
      latestTime: '今天 10:18',
      usedCount: 1,
      limitCount: 10,
      summary: '等待管理员审核',
    },
    {
      questionId: third.id,
      title: third.title,
      cover: third.cover,
      coverWidth: third.coverWidth,
      coverHeight: third.coverHeight,
      location: third.location,
      latestStatus: 'wrong',
      latestTime: '昨天 18:12',
      usedCount: 2,
      limitCount: 10,
      summary: '最近一次机位不匹配',
    },
    {
      questionId: fourth.id,
      title: fourth.title,
      cover: fourth.cover,
      coverWidth: fourth.coverWidth,
      coverHeight: fourth.coverHeight,
      location: fourth.location,
      latestStatus: 'correct',
      latestTime: '6/6 09:45',
      usedCount: 4,
      limitCount: 10,
      summary: '已获得本题积分',
    },
  ]
}

export function getContributionRecords(): ContributionRecord[] {
  const [first, second, third] = questionList
  return [
    {
      id: 1,
      title: '兴庆湖边的反光坐标',
      cover: second.cover,
      description: '线索藏在水面倒影里，建议傍晚沿湖边慢慢找，注意不要只看建筑本体。',
      location: '兴庆湖',
      status: 'pending',
      time: '今天 15:20',
    },
    {
      id: 2,
      title: '教学楼光影挑战',
      cover: third.cover,
      description: '下午四点以后光线角度更接近原图，阴影位置是判断机位的关键。',
      location: '教学楼',
      status: 'approved',
      time: '2026-06-20 10:30',
    },
    {
      id: 3,
      title: '食堂门口的彩蛋提示',
      cover: first.cover,
      description: '这是一道彩蛋题，线索来自食堂门口的公告栏和地面标识。',
      location: '食堂门口',
      status: 'rejected',
      time: '2026-06-18 16:45',
      reason: '图片边缘存在明显反光干扰，且没有拍摄到清晰的建筑参照物以作交叉验证，请重新拍摄并投稿。',
    },
  ]
}
