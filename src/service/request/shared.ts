import { useAuthStore } from '@/store/auth'

export function handleUnauthorized() {
  const authStore = useAuthStore()
  const wasLoggedIn = Boolean(authStore.isLoggedIn || authStore.userId)
  authStore.clearToken()
  // 静默处理：清空本地会话但不跳转，用户停留在当前页，可继续浏览游客可见内容。
  if (wasLoggedIn) {
    uni.showToast({ icon: 'none', title: '登录已过期，请重新登录' })
  }
}
