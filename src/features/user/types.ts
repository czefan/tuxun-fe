/** GET /user/info 的完整个人信息 VM */
export interface UserInfo {
  id: number
  netid: string
  username: string
  nickname: string
  avatar: string
  /** ← score_count */
  points: number
  level: 1 | 2 | 3
  isAdmin: boolean
  /** 本月剩余昵称修改次数，上限 4 */
  nicknameEditsRemaining: number
  /** 本月剩余头像修改次数，上限 10 */
  avatarEditsRemaining: number
}

/**
 * 登录类接口（/test/login、/user/logincallback）返回的用户摘要。
 * 契约里没有积分与修改次数余额，不要和 UserInfo 混用。
 */
export interface UserSummaryVM {
  id: number
  netid: string
  username: string
  nickname: string
  avatar: string
  level: 1 | 2 | 3
  status: 'active' | 'banned'
  /** level >= 2，供 tabbar 等外壳判断入口可见性 */
  isAdmin: boolean
}

export interface LoginResultVM extends UserSummaryVM {
  sessionId?: string
}

export interface UpdateNicknameResultVM {
  nickname: string
  nicknameEditsRemaining: number
}

export interface UpdateAvatarResultVM {
  avatarUrl: string
  avatarEditsRemaining: number
}
