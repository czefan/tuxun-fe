import { request, upload } from '@/service/request'
import type { LoginResult, UserInfoResponse, UserSummary } from '@/service/contract/types'
import type { LoginResultVM, UpdateAvatarResultVM, UpdateNicknameResultVM, UserInfo, UserSummaryVM } from './types'

/**
 * 登录类接口返回的是 UserSummary（无积分、无修改次数余额），
 * 与 /user/info 的 UserInfo 不是同一个结构，不可混用。
 */
function toUserSummaryVM(raw: UserSummary): UserSummaryVM {
  return {
    id: raw.id,
    netid: raw.netid,
    username: raw.username,
    nickname: raw.nickname,
    avatar: raw.avatar,
    level: raw.level,
    status: raw.status,
    isAdmin: raw.level >= 2,
  }
}

function toLoginResultVM(raw: LoginResult): LoginResultVM {
  return {
    ...toUserSummaryVM(raw),
    sessionId: raw.session_id,
  }
}

/** 开发/测试登录 GET /test/login（仅开发与测试环境开启） */
export async function testLogin(userId = 1, password = ''): Promise<LoginResultVM> {
  const raw = await request<LoginResult>({
    url: '/test/login',
    method: 'GET',
    query: { user_id: userId, password },
  })

  return toLoginResultVM(raw)
}

/** 登录回调 GET /user/logincallback（无需登录，用 OAuth2 code + redirect_uri 换取会话） */
export async function loginCallback(code: string, redirectUri: string): Promise<LoginResultVM> {
  const raw = await request<LoginResult>({
    url: '/user/logincallback',
    method: 'GET',
    query: { code, redirect_uri: redirectUri },
  })

  return toLoginResultVM(raw)
}

/** 退出登录 DELETE /user/logout（清除 Session） */
export function logout(): Promise<void> {
  return request<void>({
    url: '/user/logout',
    method: 'DELETE',
  })
}

/** 获取个人信息 GET /user/info（权限：L1） */
export async function getUserInfo(options?: { silentAuth?: boolean }): Promise<UserInfo> {
  const raw = await request<UserInfoResponse>({
    url: '/user/info',
    method: 'GET',
    silentAuth: options?.silentAuth,
  })

  return {
    id: raw.id,
    netid: raw.netid,
    username: raw.username,
    nickname: raw.nickname,
    avatar: raw.avatar,
    points: raw.score_count,
    level: raw.level,
    isAdmin: raw.level >= 2,
    nicknameEditsRemaining: raw.nickname_edits_remaining,
    avatarEditsRemaining: raw.avatar_edits_remaining,
  }
}

/** 修改昵称 PUT /user/nickname（权限：L1，每自然月 4 次，超限 429/code=9） */
export async function updateNickname(nickname: string): Promise<UpdateNicknameResultVM> {
  const raw = await request<{
    nickname: string
    nickname_edits_remaining: number
  }>({
    url: '/user/nickname',
    method: 'PUT',
    data: { nickname },
  })

  return {
    nickname: raw.nickname,
    nicknameEditsRemaining: raw.nickname_edits_remaining,
  }
}

/**
 * 修改头像 PUT /user/avatar（权限：L1，每自然月 10 次，multipart 字段名 `avatar`）
 */
export async function updateAvatar(filePath: string): Promise<UpdateAvatarResultVM> {
  const raw = await upload<{
    avatar: string
    avatar_edits_remaining: number
  }>({
    url: '/user/avatar',
    filePath,
    name: 'avatar',
    method: 'PUT',
  })

  return {
    avatarUrl: raw.avatar,
    avatarEditsRemaining: raw.avatar_edits_remaining,
  }
}
