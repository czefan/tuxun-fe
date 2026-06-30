import { ref } from 'vue'
import { onHide, onShow, onTabItemTap } from '@dcloudio/uni-app'

export function triggerTabBarFeedback() {
  // #ifndef H5
  uni.vibrateShort({
    type: 'light',
    fail: () => {},
  })
  // #endif
}

export function useTabBarFeedback(callback?: () => void) {
  const customTabBarVisible = ref(false)

  onShow(() => {
    customTabBarVisible.value = false
    uni.hideTabBar({
      animation: false,
      fail: () => {},
      complete: () => {
        customTabBarVisible.value = true
      },
    })
  })

  onHide(() => {
    customTabBarVisible.value = false
  })

  onTabItemTap(() => {
    triggerTabBarFeedback()
    callback?.()
  })

  return {
    customTabBarVisible,
  }
}
