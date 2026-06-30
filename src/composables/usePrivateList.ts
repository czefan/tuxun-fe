import { computed } from 'vue'
import { useUserStore } from '@/store/user'

export function usePrivateList<T>(readList: () => T[], loggedInEmptyText: string) {
  const userStore = useUserStore()
  const isLoggedIn = computed(() => userStore.isLoggedIn())
  const list = computed(() => (isLoggedIn.value ? readList() : []))
  const emptyText = computed(() => (isLoggedIn.value ? loggedInEmptyText : '未登录'))

  return {
    isLoggedIn,
    list,
    emptyText,
  }
}
