import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useUserStore } from '../store/user'
import { useAuth } from './use-auth'

describe('useAuth 响应式测试', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('userInfo 与 isLoggedIn 必须保持响应式，store 改变时引用联动更新', () => {
    const userStore = useUserStore()
    const { userInfo, isLoggedInRef } = useAuth()

    expect(isLoggedInRef.value).toBe(false)
    expect(userInfo.value).toBeNull()

    // 修改 store 状态
    userStore.setUserInfo({
      id: 1,
      username: 'alice',
      nickname: 'Alice',
      avatar: '',
      level: 1,
      points: 100,
      isAdmin: false,
      nicknameEditsRemaining: 3,
      avatarEditsRemaining: 3,
      netid: 'netid1',
    })

    expect(isLoggedInRef.value).toBe(true)
    expect(userInfo.value?.nickname).toBe('Alice')
  })
})
