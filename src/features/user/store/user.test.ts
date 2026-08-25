import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useUserStore } from './user'
import { StorageKey } from '@/constants'

describe('登出清理', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('登出必须清掉答题草稿与投稿草稿——共用设备时会泄露作答坐标与投稿数据', () => {
    const getStorageInfoSync = uni.getStorageInfoSync as unknown as ReturnType<typeof vi.fn>
    const removeStorageSync = uni.removeStorageSync as unknown as ReturnType<typeof vi.fn>

    getStorageInfoSync.mockReturnValue({
      keys: ['tuxun_submit_attempt_draft_1', 'tuxun_submit_attempt_draft_2', 'unrelated_key'],
      currentSize: 0,
      limitSize: 0,
    })

    useUserStore().logout()

    const removed = removeStorageSync.mock.calls.map((call) => call[0])
    expect(removed, '答题草稿没有被清理').toContain('tuxun_submit_attempt_draft_1')
    expect(removed).toContain('tuxun_submit_attempt_draft_2')
    // 投稿草稿与鉴权键一并清理
    expect(removed).toContain(StorageKey.ContributeDraft)
    expect(removed).toContain(StorageKey.Token)
    // 不相干的键不能误删
    expect(removed).not.toContain('unrelated_key')
  })
})
