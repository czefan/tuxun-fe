import type { ScoreReasonType } from './text'

export interface ScoreLogVM {
  id: number
  delta: number
  balance: number
  reason: ScoreReasonType
  relatedId: number | null
  relatedType: 'photo' | 'exchange' | null
  relatedTitle?: string | null
  createdAt: string
}
