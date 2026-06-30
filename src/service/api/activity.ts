/**
 * 活动相关接口（当期/往期活动、题目、作答、评论）
 */
import { request, uploadFile } from '../request'
import type { PageParams, PageResult } from './types'

export type SortType = 'hot' | 'latest'
export type ReviewStatus = 'pending' | 'approved' | 'rejected'
export type AnswerStatus = 'pending' | 'correct' | 'wrong'

/** 活动基本类型 */
export interface Activity {
  id: number
  title: string
  coverUrl: string
  description: string
  startTime: string
  endTime: string
  status: 'upcoming' | 'ongoing' | 'finished'
  questionCount: number
}

/** 题目基本类型 */
export interface Question {
  id: number
  activityId: number
  title: string
  imageUrl: string
  description: string
  /** 正确答案坐标（结束后展示） */
  answerLat?: number
  answerLng?: number
  likeCount: number
  commentCount: number
  isLiked: boolean
}

/** 评论 */
export interface Comment {
  id: number
  questionId: number
  userId: number
  nickname: string
  avatar: string
  content: string
  createdAt: string
}

export interface QuestionListParams extends PageParams {
  sortType?: SortType
  keyword?: string
}

export interface UploadResult {
  url: string
  width?: number
  height?: number
}

export interface CreateQuestionPayload {
  title: string
  description: string
  imageUrls: string[]
  address: string
  latitude: number
  longitude: number
  contact?: string
}

export interface SubmitAnswerPayload {
  questionId: number
  imageUrl: string
  address: string
  latitude: number
  longitude: number
  content?: string
}

export interface QuestionContribution {
  id: number
  questionId?: number
  title: string
  coverUrl: string
  description: string
  location: string
  status: ReviewStatus
  reason?: string
  createdAt: string
}

export interface AnswerRecord {
  id: number
  questionId: number
  userId: number
  nickname: string
  avatar: string
  imageUrl: string
  answeredAt: string
  likeCount: number
  isLiked: boolean
}

export interface MyAnswerRecord {
  id: number
  questionId: number
  imageUrl: string
  status: AnswerStatus
  answeredAt: string
  likeCount?: number
  isLiked?: boolean
}

export interface MyAnswerQuestionRecord {
  questionId: number
  title: string
  coverUrl: string
  location: string
  latestStatus: AnswerStatus
  latestTime: string
  usedCount: number
  limitCount: number
  summary: string
}

export interface LikeResult {
  liked: boolean
  likeCount: number
}

/** 获取当期活动 */
export function getCurrentActivity() {
  return request<Activity>({
    url: '/api/activity/current',
  })
}

/** 获取往期活动列表 */
export function getHistoryActivities(params: PageParams) {
  return request<PageResult<Activity>>({
    url: '/api/activity/history',
    data: params as unknown as Record<string, unknown>,
  })
}

/** 获取当期活动题目列表 */
export function getCurrentActivityQuestions(params: QuestionListParams) {
  return request<PageResult<Question>>({
    url: '/api/activity/current/questions',
    data: params as unknown as Record<string, unknown>,
  })
}

/** 获取某期活动题目列表 */
export function getActivityQuestions(activityId: number, params: QuestionListParams) {
  return request<PageResult<Question>>({
    url: `/api/activity/${activityId}/questions`,
    data: params as unknown as Record<string, unknown>,
  })
}

/** 获取题目详情 */
export function getQuestionDetail(id: number) {
  return request<Question>({
    url: `/api/question/${id}`,
  })
}

/** 上传题目/作答图片 */
export function uploadQuestionImage(filePath: string) {
  return uploadFile<UploadResult>({
    url: '/api/upload/question-image',
    filePath,
  })
}

/** 投稿题目 */
export function createQuestionContribution(data: CreateQuestionPayload) {
  return request<QuestionContribution>({
    url: '/api/question/contributions',
    method: 'POST',
    data: data as unknown as Record<string, unknown>,
  })
}

/** 获取我的投稿记录 */
export function getMyQuestionContributions(params: PageParams & { status?: ReviewStatus | 'all' }) {
  return request<PageResult<QuestionContribution>>({
    url: '/api/question/contributions/mine',
    data: params as unknown as Record<string, unknown>,
  })
}

/** 提交作答 */
export function submitAnswer(data: SubmitAnswerPayload) {
  return request<MyAnswerRecord>({
    url: '/api/answer/submit',
    method: 'POST',
    data: data as unknown as Record<string, unknown>,
  })
}

/** 获取题目的公开作答记录 */
export function getQuestionAnswerRecords(questionId: number, params: PageParams) {
  return request<PageResult<AnswerRecord>>({
    url: `/api/question/${questionId}/answers`,
    data: params as unknown as Record<string, unknown>,
  })
}

/** 获取当前用户对某题的作答记录 */
export function getMyQuestionAnswerRecords(questionId: number, params: PageParams) {
  return request<PageResult<MyAnswerRecord>>({
    url: `/api/question/${questionId}/answers/mine`,
    data: params as unknown as Record<string, unknown>,
  })
}

/** 获取我的答题题目记录 */
export function getMyAnswerQuestions(params: PageParams & { status?: AnswerStatus | 'all' }) {
  return request<PageResult<MyAnswerQuestionRecord>>({
    url: '/api/answers/mine',
    data: params as unknown as Record<string, unknown>,
  })
}

/** 获取评论列表 */
export function getComments(questionId: number, params: PageParams) {
  return request<PageResult<Comment>>({
    url: `/api/question/${questionId}/comments`,
    data: params as unknown as Record<string, unknown>,
  })
}

/** 发表评论 */
export function postComment(data: { questionId: number, content: string }) {
  return request({
    url: '/api/comment',
    method: 'POST',
    data: data as unknown as Record<string, unknown>,
  })
}

/** 点赞 / 取消点赞 */
export function toggleQuestionLike(questionId: number) {
  return request<LikeResult>({
    url: `/api/question/${questionId}/like`,
    method: 'POST',
  })
}

/** 作答记录点赞 / 取消点赞 */
export function toggleAnswerRecordLike(answerRecordId: number) {
  return request<LikeResult>({
    url: `/api/answer-records/${answerRecordId}/like`,
    method: 'POST',
  })
}

/** 兼容旧命名：题目点赞 / 取消点赞 */
export const toggleLike = toggleQuestionLike
