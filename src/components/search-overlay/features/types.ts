export type SearchScope = 'home' | 'history' | 'notice' | 'activity' | 'mall' | 'answers'

export interface SearchResult {
  id: string
  title: string
  desc: string
  meta: string
}
