export interface ProductItem {
  id: number
  title: string
  desc: string
  points: number
  stockText: string
  cover: string
  coverWidth: number
  coverHeight: number
  badge?: string
}

export interface ProductWaterfallChangeEvent {
  name: 'list1' | 'list2'
  value: ProductItem
}

export type ExchangeStatus = 'pending' | 'completed'

export interface ExchangeRecord {
  id: string
  productId: number
  title: string
  cover: string
  points: number
  count: number
  totalPoints: number
  time: string
  status: ExchangeStatus
  exchangeCode?: string
}
