export const StorageKey = {
  Token: 'token',
  UserInfo: 'user_info',
  OAuthRedirectUri: 'oauth:redirect-uri',
  OAuthReturnUrl: 'oauth:return-url',
  OAuthState: 'oauth:state',
  OAuthRedirectUrl: 'oauth_redirect_url',
  OAuthRedirectAttempts: 'oauth_redirect_attempts',
  PendingActions: 'pending_actions',
  EnvNamespaceFingerprint: 'env_namespace_fingerprint',
  ReadNoticeIds: 'tuxun_read_notices',
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
  StorageKey.UserInfo,
  StorageKey.OAuthRedirectUri,
  StorageKey.OAuthReturnUrl,
  StorageKey.OAuthState,
  StorageKey.OAuthRedirectUrl,
  StorageKey.OAuthRedirectAttempts,
  StorageKey.PendingActions,
  StorageKey.ReadNoticeIds,
] as const
