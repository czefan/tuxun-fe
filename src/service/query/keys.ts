/**
 * 全局集中式 QueryKey 工厂 (避免域间交叉 import key)
 */
export const qk = {
  user: {
    info: () => ['user', 'info'] as const,
  },
  activity: {
    all: () => ['activity'] as const,
    active: () => ['activity', 'active'] as const,
    list: (params?: unknown) => ['activity', 'list', params] as const,
  },
  photo: {
    all: () => ['photo'] as const,
    list: (params?: unknown) => ['photo', 'list', params] as const,
    detail: (id: number) => ['photo', 'detail', id] as const,
  },
  attempt: {
    solves: (photoId: number, params?: unknown) => params !== undefined ? (['attempt', 'solves', photoId, params] as const) : (['attempt', 'solves', photoId] as const),
    userAttempts: (photoId: number, params?: unknown) => params !== undefined ? (['attempt', 'userAttempts', photoId, params] as const) : (['attempt', 'userAttempts', photoId] as const),
  },
  comment: {
    list: (photoId: number, params?: unknown) => params !== undefined ? (['comment', 'list', photoId, params] as const) : (['comment', 'list', photoId] as const),
  },
  record: {
    photos: (params?: unknown) => ['record', 'photos', params] as const,
    photoDetail: (id: number) => ['record', 'photoDetail', id] as const,
    attempts: (params?: unknown) => ['record', 'attempts', params] as const,
  },
  score: {
    logs: (params?: unknown) => ['score', 'logs', params] as const,
  },
  mall: {
    goods: (params?: unknown) => ['mall', 'goods', params] as const,
    exchanges: (params?: unknown) => ['mall', 'exchanges', params] as const,
  },
  notification: {
    announcements: (params?: unknown) => ['notification', 'announcements', params] as const,
    announcementDetail: (id: number) => ['notification', 'announcementDetail', id] as const,
    interactions: (params?: unknown) => ['notification', 'interactions', params] as const,
  },
  content: {
    detail: (key: string) => ['content', 'detail', key] as const,
  },
}
