/**
 * 用户相关接口（积分、反馈）
 */
import { request, uploadFile } from '../request'
import type { PageParams, PageResult } from './types'

export type PointLedgerType = 'answer' | 'contribution' | 'exchange' | 'adjustment'
export type FeedbackType = 'bug' | 'suggestion' | 'content' | 'other'
export type FeedbackStatus = 'pending' | 'processing' | 'resolved' | 'closed'

export interface PointSummaryDto {
  total: number
  available: number
  frozen?: number
  earnedTotal?: number
  consumedTotal?: number
}

export interface PointLedgerDto {
  id: number
  type: PointLedgerType
  title: string
  points: number
  balance?: number
  relatedId?: number
  createdAt: string
}

export interface PointLedgerParams extends PageParams {
  type?: PointLedgerType | 'all'
}

export interface PointRuleDto {
  id: number
  title: string
  description: string
  points?: number
}

export interface FeedbackImageUploadResultDto {
  url: string
}

export type AvatarUploadResultDto = string | {
  avatar?: string
  url?: string
  data?: {
    avatar?: string
    url?: string
  }
}

export interface SubmitFeedbackPayload {
  content: string
  type?: FeedbackType
  contact?: string
  imageUrls?: string[]
}

export interface FeedbackRecordDto {
  id: number
  type: FeedbackType
  content: string
  imageUrls: string[]
  status: FeedbackStatus
  reply?: string
  createdAt: string
  updatedAt?: string
}

/** 获取当前用户积分概览 */
export function getPointSummary() {
  return request<PointSummaryDto>({
    url: '/api/user/points/summary',
  })
}

/** 获取当前用户积分流水 */
export function getPointLedger(params: PointLedgerParams) {
  return request<PageResult<PointLedgerDto>>({
    url: '/api/user/points/ledger',
    data: params as unknown as Record<string, unknown>,
  })
}

/** 获取积分规则 */
export function getPointRules() {
  return request<PointRuleDto[]>({
    url: '/api/user/points/rules',
  })
}

/** 上传反馈图片 */
export function uploadFeedbackImage(filePath: string) {
  return uploadFile<FeedbackImageUploadResultDto>({
    url: '/api/upload/feedback-image',
    filePath,
  })
}

/** 上传用户头像，返回可写入用户资料的头像 URL */
export async function uploadAvatarImage(filePath: string, uploadUrl = '/api/upload/avatar') {
  const result = await uploadFile<AvatarUploadResultDto>({
    url: uploadUrl,
    filePath,
  })

  return readAvatarUploadUrl(result)
}

/** 提交用户反馈 */
export function submitFeedback(data: SubmitFeedbackPayload) {
  return request<FeedbackRecordDto>({
    url: '/api/user/feedback',
    method: 'POST',
    data: data as unknown as Record<string, unknown>,
  })
}

/** 获取我的反馈记录 */
export function getMyFeedback(params: PageParams & { status?: FeedbackStatus | 'all' }) {
  return request<PageResult<FeedbackRecordDto>>({
    url: '/api/user/feedback',
    data: params as unknown as Record<string, unknown>,
  })
}

function readAvatarUploadUrl(result: AvatarUploadResultDto) {
  if (typeof result === 'string') {
    return result
  }

  return result.data?.avatar || result.data?.url || result.avatar || result.url || ''
}
