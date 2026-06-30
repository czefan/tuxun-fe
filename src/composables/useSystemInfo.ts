import { computed, ref } from 'vue'

export function useSystemInfo() {
  const windowInfo = ref(uni.getWindowInfo())

  function updateSystemInfo() {
    windowInfo.value = uni.getWindowInfo()
  }

  const statusBarHeight = computed(() => windowInfo.value.statusBarHeight ?? 0)
  const navBarContentHeight = 44
  const navBarHeight = computed(() => statusBarHeight.value + navBarContentHeight)
  const safeAreaBottom = computed(() => windowInfo.value.safeAreaInsets?.bottom ?? 0)

  // 微信小程序胶囊避让逻辑
  const menuButtonWidth = ref(0)
  const menuButtonHeight = ref(0)
  const menuButtonRightSpace = ref(0)

  // #ifdef MP-WEIXIN
  try {
    const menuButton = uni.getMenuButtonBoundingClientRect()
    menuButtonWidth.value = menuButton.width
    menuButtonRightSpace.value = windowInfo.value.windowWidth - menuButton.right
    menuButtonHeight.value = menuButton.height
  }
  catch (e) {
    // 降级处理
    menuButtonWidth.value = 87
    menuButtonRightSpace.value = 7
  }
  // #endif

  // 小程序端右侧给胶囊预留的额外安全宽度
  const mpNavBarRightSpace = computed(() => {
    if (menuButtonWidth.value > 0) {
      return menuButtonWidth.value + menuButtonRightSpace.value * 2
    }
    return 0
  })

  const windowWidth = computed(() => windowInfo.value.windowWidth || 375)
  const windowHeight = computed(() => windowInfo.value.windowHeight || 667)

  return {
    statusBarHeight,
    navBarContentHeight,
    navBarHeight,
    safeAreaBottom,
    windowWidth,
    windowHeight,
    menuButtonWidth,
    menuButtonHeight,
    menuButtonRightSpace,
    mpNavBarRightSpace,
    updateSystemInfo,
  }
}
