export const StorageKey = {
  Token: 'token',
  ReadNoticeIds: 'tuxun_read_announcements',
  /** H5 登录前保存来源页，登录成功后回跳；登出时清理 */
  LoginReturnPath: 'login_return_path',
  /** OAuth CSRF state（H5 端存于 sessionStorage，会话结束即清；同时注册到清理列表双保险） */
  OAuthState: 'oauth_state',
  /** 全站公告弹窗已读版本号 */
  AnnouncementLastSeenVersion: 'announcement_last_seen_version',
  /** 投稿草稿：登出时清理，避免公用设备换人后泄漏 */
  ContributeDraft: 'tuxun_contribute_draft',
  /** 评论表情偏好：换人保留无害，不进清理清单 */
  CommentRecentEmojis: 'comment_recent_emojis',
} as const

/** 答题草稿按题目 ID 分键：`tuxun_submit_attempt_draft_{photoId}` */
export const SubmitDraftKeyPrefix = 'tuxun_submit_attempt_draft_'

export const AuthCleanupStorageKeys = [
  StorageKey.Token,
  StorageKey.ReadNoticeIds,
  StorageKey.LoginReturnPath,
  StorageKey.OAuthState,
  // 用户产生的内容必须一并清除：公用设备上换人登录后，
  // 草稿会被自动回填进表单，等于把上一个人的作答坐标/投稿内容直接交出去
  StorageKey.ContributeDraft,
] as const
