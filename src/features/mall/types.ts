import type { ImageVM, PageParams } from '@/service/contract/types'

export interface GoodsQueryParams extends PageParams {
  keyword?: string
}

export interface GoodsVM {
  id: number
  name: string
  description: string
  image: ImageVM
  scorePrice: number
  stock: number
  status: 'in_store' | 'out_store'
  createdAt: string
}

export interface ExchangeRecordVM {
  id: number
  verifyCode: string
  good: {
    id: number
    name: string
    image: ImageVM
  }
  scorePrice: number
  quantity: number
  scoreCost: number
  status: 'pending' | 'verified' | 'cancelled'
  exchangeAt: string | null
  createdAt: string
}
