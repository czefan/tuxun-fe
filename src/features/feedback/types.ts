export interface SubmitFeedbackPayload {
  title?: string
  content: string
  /** 契约枚举，勿改：1-内容 2-玩法 3-技术 4-其他 */
  type?: 1 | 2 | 3 | 4
  phone?: string
  /** 单附件本地路径：图片 jpg/png ≤20MB 或视频 mp4/mov ≤50MB */
  mediaFile?: string
}

export interface FeedbackResultVM {
  id: number
  status: 'pending' | 'resolved'
}
