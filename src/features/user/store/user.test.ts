import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useUserStore } from './user'
import { StorageKey } from '@/constants'

describe('登出清理', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('登出必须清掉搜索历史——共用设备时会泄露给下一个人', () => {
    const getStorageInfoSync = uni.getStorageInfoSync as unknown as ReturnType<typeof vi.fn>
    const removeStorageSync = uni.removeStorageSync as unknown as ReturnType<typeof vi.fn>

    getStorageInfoSync.mockReturnValue({
      keys: ['searchHistory:home', 'searchHistory:activity', 'unrelated_key'],
      currentSize: 0,
      limitSize: 0,
    })

    useUserStore().logout()

    const removed = removeStorageSync.mock.calls.map(call => call[0])
    expect(removed, '搜索历史没有被清理').toContain('searchHistory:home')
    expect(removed).toContain('searchHistory:activity')
    // 常规鉴权键仍要清
    expect(removed).toContain(StorageKey.Token)
    // 不相干的键不能误删
    expect(removed).not.toContain('unrelated_key')
  })
})
