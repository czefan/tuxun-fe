import type { ProductItem } from './types'

export function canExchangeProduct(item: ProductItem) {
  return !item.stockText.includes('即将开放') && !item.stockText.includes('库存 0')
}

export function getExchangeButtonText(item: ProductItem) {
  return canExchangeProduct(item) ? '兑换' : '即将开放'
}
