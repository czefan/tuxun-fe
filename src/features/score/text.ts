export type ScoreReasonType = 'answer_correct' | 'review_pass' | 'exchange' | 'admin_adjust'

export const SCORE_REASON_TEXT: Record<ScoreReasonType, string> = {
  answer_correct: '作答正确',
  review_pass: '投稿通过',
  exchange: '商品兑换',
  admin_adjust: '系统调整',
}
