/** 题目卡片列表类型 */
export interface QuestionCard {
  id: number
  title: string
  cover: string
  coverWidth: number
  coverHeight: number
  avatar: string
  author: string
  heat: string
  heatValue: number
  createdAt: number
  body: string
  location: string
  overlayText?: string
  isVideo?: boolean
  answerEnded?: boolean
  liked?: boolean
}

/** 题目答题纪录类型 */
export interface AnswerRecord {
  id: number
  userName: string
  avatar: string
  image: string
  imageWidth: number
  imageHeight: number
  answeredAt: string
  likes: number
}

export type MyAnswerStatus = 'pending' | 'wrong' | 'correct'

export interface MyAnswerRecord {
  id: number
  status: MyAnswerStatus
  image: string
  imageWidth: number
  imageHeight: number
  answeredAt: string
  likes?: number
}
