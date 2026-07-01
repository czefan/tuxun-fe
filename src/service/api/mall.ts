/**
 * 积分商城相关接口（商品列表、兑换、核销）
 */
import { request } from '../request'
import { ApiEndpoint } from './endpoints'
import type { PageParams, PageResult } from './types'

/** 商品 */
export interface Product {
  id: number
  name: string
  imageUrl: string
  description: string
  price: number
  stock: number
}

/** 兑换订单 */
export interface Order {
  id: number
  productId: number
  productName: string
  productImage: string
  price: number
  status: 'pending' | 'verified' | 'expired'
  createdAt: string
  verifyCode?: string
}

export interface ProductListParams extends PageParams {
  keyword?: string
}

export interface ExchangeProductPayload {
  productId: number
  count?: number
}

export interface VerifyOrderPayload {
  orderId?: number
  verifyCode?: string
}

/** 获取商品列表 */
export function getProducts(params: ProductListParams) {
  return request<PageResult<Product>>({
    url: ApiEndpoint.mall.products,
    data: params as unknown as Record<string, unknown>,
  })
}

/** 获取商品详情 */
export function getProductDetail(productId: number) {
  return request<Product>({
    url: ApiEndpoint.mall.productDetail(productId),
  })
}

/** 积分兑换 */
export function exchangeProduct(data: number | ExchangeProductPayload) {
  const payload = typeof data === 'number' ? { productId: data, count: 1 } : data

  return request<Order>({
    url: ApiEndpoint.mall.exchange,
    method: 'POST',
    data: payload as unknown as Record<string, unknown>,
  })
}

/** 获取我的订单 / 账单 */
export function getMyOrders(params: PageParams) {
  return request<PageResult<Order>>({
    url: ApiEndpoint.mall.orders,
    data: params as unknown as Record<string, unknown>,
  })
}

/** 获取我的兑换记录 */
export const getExchangeRecords = getMyOrders

/** 核销订单（管理员） */
export function verifyOrder(data: number | VerifyOrderPayload) {
  const payload = typeof data === 'number' ? { orderId: data } : data

  return request({
    url: ApiEndpoint.mall.verifyOrder,
    method: 'POST',
    data: payload as unknown as Record<string, unknown>,
  })
}
