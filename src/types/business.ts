/**
 * 全局业务身份类型定义。
 */

export type UserRole = string

/** 用户信息 */
export interface UserInfo {
  id: number
  nickname: string
  avatar: string
  points: number
  isAdmin: boolean
  role?: UserRole
  roles?: UserRole[]
}
