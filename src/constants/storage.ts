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
} as const

export type StorageKeyValue = (typeof StorageKey)[keyof typeof StorageKey]

export const AuthCleanupStorageKeys = [
  StorageKey.Token,
  StorageKey.UserInfo,
  StorageKey.OAuthRedirectUri,
  StorageKey.OAuthReturnUrl,
  StorageKey.OAuthState,
  StorageKey.OAuthRedirectUrl,
  StorageKey.OAuthRedirectAttempts,
  StorageKey.PendingActions,
] as const
