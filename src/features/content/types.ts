export type ContentKey = 'popup' | 'score_rules' | 'help'

export interface ContentBlockVM {
  key: ContentKey
  content: string
  relatedId?: number | null
  version: number
  updatedAt: string
}
