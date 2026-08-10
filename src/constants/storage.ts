export const StorageKey = {
  Token: 'token',
  ReadNoticeIds: 'tuxun_read_announcements',
  /** H5 登录前保存来源页，登录成功后回跳；登出时清理 */
  LoginReturnPath: 'login_return_path',
  /** OAuth CSRF state（H5 端存于 sessionStorage，会话结束即清；同时注册到清理列表双保险） */
  OAuthState: 'oauth_state',
  /** 全站公告弹窗已读版本号 */
  AnnouncementLastSeenVersion: 'announcement_last_seen_version',
} as const

/**
 * 搜索历史按 scope 分键存放，键名是 `searchHistory:<scope>`。
 * 走前缀而不是逐个枚举，是为了新增 scope 时不用回来改这里。
 */
export const SearchHistoryKeyPrefix = 'searchHistory:'

export function getSearchHistoryKey(scope: string) {
  return `${SearchHistoryKeyPrefix}${scope}`
}

export const AuthCleanupStorageKeys = [
  StorageKey.Token,
  StorageKey.ReadNoticeIds,
  StorageKey.LoginReturnPath,
  StorageKey.OAuthState,
] as const
