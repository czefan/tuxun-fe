import { useUserStore } from '@/store/user'
import { toLoginPage } from '@/utils/toLoginPage'

export function handleUnauthorized() {
  const userStore = useUserStore()
  userStore.logout()
  toLoginPage()
}
