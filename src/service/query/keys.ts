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
    list: (params?: unknown) =>
      params === undefined
        ? (['activity', 'list'] as const)
        : (['activity', 'list', params] as const),
  },
  photo: {
    all: () => ['photo'] as const,
    list: (params?: unknown) =>
      params === undefined ? (['photo', 'list'] as const) : (['photo', 'list', params] as const),
    detail: (id: number) => ['photo', 'detail', id] as const,
  },
  attempt: {
    solves: (photoId: number, params?: unknown) =>
      params !== undefined
        ? (['attempt', 'solves', photoId, params] as const)
        : (['attempt', 'solves', photoId] as const),
    userAttempts: (photoId: number, params?: unknown) =>
      params !== undefined
        ? (['attempt', 'userAttempts', photoId, params] as const)
        : (['attempt', 'userAttempts', photoId] as const),
  },
  comment: {
    list: (photoId: number, params?: unknown) =>
      params !== undefined
        ? (['comment', 'list', photoId, params] as const)
        : (['comment', 'list', photoId] as const),
  },
  record: {
    photos: (params?: unknown) =>
      params === undefined
        ? (['record', 'photos'] as const)
        : (['record', 'photos', params] as const),
    photoDetail: (id: number) => ['record', 'photoDetail', id] as const,
    attempts: (params?: unknown) =>
      params === undefined
        ? (['record', 'attempts'] as const)
        : (['record', 'attempts', params] as const),
  },
  score: {
    logs: (params?: unknown) =>
      params === undefined ? (['score', 'logs'] as const) : (['score', 'logs', params] as const),
  },
  mall: {
    goods: (params?: unknown) =>
      params === undefined ? (['mall', 'goods'] as const) : (['mall', 'goods', params] as const),
    exchanges: (params?: unknown) =>
      params === undefined
        ? (['mall', 'exchanges'] as const)
        : (['mall', 'exchanges', params] as const),
  },
  notification: {
    announcements: (params?: unknown) =>
      params === undefined
        ? (['notification', 'announcements'] as const)
        : (['notification', 'announcements', params] as const),
    announcementDetail: (id: number) => ['notification', 'announcementDetail', id] as const,
    interactions: (params?: unknown) =>
      params === undefined
        ? (['notification', 'interactions'] as const)
        : (['notification', 'interactions', params] as const),
  },
  content: {
    detail: (key: string) => ['content', 'detail', key] as const,
  },
}
