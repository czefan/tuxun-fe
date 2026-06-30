/**
 * 下一帧执行回调（兼容 H5 与小程序）。
 */
export function runNextFrame(callback: () => void) {
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(callback)
    return
  }

  setTimeout(callback, 16)
}

/**
 * 确保在下一次 DOM 绘制/排版完成后执行（双帧回调）。
 */
export function runAfterPaint(callback: () => void) {
  runNextFrame(() => {
    runNextFrame(callback)
  })
}

/**
 * 获取当前页面滚动条高度（兼容 H5 与其它平台）。
 */
export function getPageScrollTop(): number {
  // #ifdef H5
  return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
  // #endif

  // #ifndef H5
  return 0
  // #endif
}

/**
 * rpx 转 px（兼容各平台）。
 */
export function rpxToPx(value: number): number {
  const windowWidth = uni.getWindowInfo().windowWidth || 375
  return (value * windowWidth) / 750
}
