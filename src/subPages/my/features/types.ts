export interface PointLedgerItem {
  id: number
  score: number
  title: string
  time: string
}

export type AnswerStatus = 'pending' | 'wrong' | 'correct'

export interface AnswerQuestionRecord {
  questionId: number
  title: string
  cover: string
  coverWidth: number
  coverHeight: number
  location: string
  latestStatus: AnswerStatus
  latestTime: string
  usedCount: number
  limitCount: number
  summary: string
}

export type ContributionStatus = 'pending' | 'approved' | 'rejected'

export interface ContributionRecord {
  id: number
  title: string
  cover: string
  description: string
  location: string
  status: ContributionStatus
  time: string
  reason?: string
}
