import { request, upload } from '@/service/request'
import type { FeedbackResultVM, SubmitFeedbackPayload } from './types'

/** 提交反馈 POST /feedback（权限：L1，支持单图/视频附件 media_file） */
export async function submitFeedback(payload: SubmitFeedbackPayload): Promise<FeedbackResultVM> {
  const formData: Record<string, unknown> = {
    title: payload.title || '意见反馈',
    content: payload.content,
    type: payload.type || 1,
  }
  if (payload.phone) {
    formData.phone = payload.phone
  }

  const filePath = payload.mediaFile

  // 无附件时按普通 JSON 提交
  if (!filePath) {
    return request<FeedbackResultVM>({
      url: '/feedback',
      method: 'POST',
      data: formData,
    })
  }

  // 有附件时走单文件上传 (name 为契约要求的 media_file)
  return upload<FeedbackResultVM>({
    url: '/feedback',
    filePath,
    name: 'media_file',
    method: 'POST',
    formData,
  })
}
