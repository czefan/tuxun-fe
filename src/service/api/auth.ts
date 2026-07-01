/**
 * 认证 / 登录相关接口（OAuth 统一认证）
 */
import { request } from '../request'
import { ApiEndpoint } from './endpoints'
import type { UserInfo } from '@/types/business'

export interface AuthSession {
  token: string
  userInfo: UserInfo
}

export interface OAuthLoginUrlParams {
  redirectUri: string
  returnUrl?: string
  state?: string
}

export interface OAuthCodePayload {
  code: string
  redirectUri: string
  state?: string
}

export interface OAuthLoginUrlResult {
  loginUrl: string
}

export interface OAuthCallbackError {
  error: string
  errorDescription?: string
}

export interface UpdateUserProfilePayload {
  nickname?: string
  avatar?: string
}

/** 获取 OAuth 授权地址 */
export function getOAuthLoginUrl(params: OAuthLoginUrlParams) {
  return request<OAuthLoginUrlResult>({
    url: ApiEndpoint.auth.oauthLoginUrl,
    method: 'POST',
    data: params as unknown as Record<string, unknown>,
    auth: false,
  })
}

/** 使用 OAuth authorization code 换取本系统登录态 */
export function loginByOAuthCode(data: OAuthCodePayload) {
  return request<AuthSession>({
    url: ApiEndpoint.auth.oauthCode,
    method: 'POST',
    data: data as unknown as Record<string, unknown>,
    auth: false,
  })
}

/** 获取当前用户信息 */
export function getUserInfo() {
  return request<UserInfo>({
    url: ApiEndpoint.auth.userInfo,
  })
}

/** 更新当前用户资料 */
export function updateUserProfile(data: UpdateUserProfilePayload) {
  return request<UserInfo>({
    url: ApiEndpoint.auth.userInfo,
    method: 'PUT',
    data: data as unknown as Record<string, unknown>,
  })
}

/** 退出登录 */
export function logout() {
  return request<void>({
    url: ApiEndpoint.auth.logout,
    method: 'POST',
  })
}
