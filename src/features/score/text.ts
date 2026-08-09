export type ScoreReasonType = 'answer_correct' | 'review_pass' | 'exchange' | 'admin_adjust'

export const SCORE_REASON_TEXT: Record<ScoreReasonType, string> = {
  answer_correct: '破解成功奖励',
  review_pass: '投稿通过奖励',
  exchange: '商品兑换扣减',
  admin_adjust: '系统积分调整',
}
