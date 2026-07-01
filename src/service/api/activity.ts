/**
 * 活动相关接口（当期/往期活动、题目、作答、评论）
 */
import { request, uploadFile } from '../request'
import { ApiEndpoint } from './endpoints'
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
    url: ApiEndpoint.activity.current,
  })
}

/** 获取往期活动列表 */
export function getHistoryActivities(params: PageParams) {
  return request<PageResult<Activity>>({
    url: ApiEndpoint.activity.history,
    data: params as unknown as Record<string, unknown>,
  })
}

/** 获取当期活动题目列表 */
export function getCurrentActivityQuestions(params: QuestionListParams) {
  return request<PageResult<Question>>({
    url: ApiEndpoint.activity.currentQuestions,
    data: params as unknown as Record<string, unknown>,
  })
}

/** 获取某期活动题目列表 */
export function getActivityQuestions(activityId: number, params: QuestionListParams) {
  return request<PageResult<Question>>({
    url: ApiEndpoint.activity.questions(activityId),
    data: params as unknown as Record<string, unknown>,
  })
}

/** 获取题目详情 */
export function getQuestionDetail(id: number) {
  return request<Question>({
    url: ApiEndpoint.question.detail(id),
  })
}

/** 上传题目/作答图片 */
export function uploadQuestionImage(filePath: string) {
  return uploadFile<UploadResult>({
    url: ApiEndpoint.upload.questionImage,
    filePath,
  })
}

/** 投稿题目 */
export function createQuestionContribution(data: CreateQuestionPayload) {
  return request<QuestionContribution>({
    url: ApiEndpoint.question.contributions,
    method: 'POST',
    data: data as unknown as Record<string, unknown>,
  })
}

/** 获取我的投稿记录 */
export function getMyQuestionContributions(params: PageParams & { status?: ReviewStatus | 'all' }) {
  return request<PageResult<QuestionContribution>>({
    url: ApiEndpoint.question.myContributions,
    data: params as unknown as Record<string, unknown>,
  })
}

/** 提交作答 */
export function submitAnswer(data: SubmitAnswerPayload) {
  return request<MyAnswerRecord>({
    url: ApiEndpoint.answer.submit,
    method: 'POST',
    data: data as unknown as Record<string, unknown>,
  })
}

/** 获取题目的公开作答记录 */
export function getQuestionAnswerRecords(questionId: number, params: PageParams) {
  return request<PageResult<AnswerRecord>>({
    url: ApiEndpoint.question.answers(questionId),
    data: params as unknown as Record<string, unknown>,
  })
}

/** 获取当前用户对某题的作答记录 */
export function getMyQuestionAnswerRecords(questionId: number, params: PageParams) {
  return request<PageResult<MyAnswerRecord>>({
    url: ApiEndpoint.question.myAnswers(questionId),
    data: params as unknown as Record<string, unknown>,
  })
}

/** 获取我的答题题目记录 */
export function getMyAnswerQuestions(params: PageParams & { status?: AnswerStatus | 'all' }) {
  return request<PageResult<MyAnswerQuestionRecord>>({
    url: ApiEndpoint.answer.mine,
    data: params as unknown as Record<string, unknown>,
  })
}

/** 获取评论列表 */
export function getComments(questionId: number, params: PageParams) {
  return request<PageResult<Comment>>({
    url: ApiEndpoint.comment.list(questionId),
    data: params as unknown as Record<string, unknown>,
  })
}

/** 发表评论 */
export function postComment(data: { questionId: number, content: string }) {
  return request({
    url: ApiEndpoint.comment.create,
    method: 'POST',
    data: data as unknown as Record<string, unknown>,
  })
}

/** 点赞 / 取消点赞 */
export function toggleQuestionLike(questionId: number) {
  return request<LikeResult>({
    url: ApiEndpoint.question.like(questionId),
    method: 'POST',
  })
}

/** 作答记录点赞 / 取消点赞 */
export function toggleAnswerRecordLike(answerRecordId: number) {
  return request<LikeResult>({
    url: ApiEndpoint.answer.recordLike(answerRecordId),
    method: 'POST',
  })
}

/** 兼容旧命名：题目点赞 / 取消点赞 */
export const toggleLike = toggleQuestionLike
