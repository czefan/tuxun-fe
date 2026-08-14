import { nextTick } from 'vue'

/**
 * 基于原生 View Transitions API 的页面转场。
 *
 * 关键约束：`document.startViewTransition(cb)` 会在调用瞬间截一张旧快照，
 * 执行 cb 并**等它返回的 Promise**，再截一张新快照做补间。所以 cb 里必须是
 * 真正会改变 DOM 的操作，而且要等到改完。把它套在一个同步的 `emit()` 上
 * 没有任何效果——emit 立即返回，两张快照一模一样。
 */

/** H5 且浏览器支持 View Transitions 时为 true */
function isViewTransitionSupported(): boolean {
  // #ifdef H5
  return typeof document !== 'undefined'
    && typeof (document as any).startViewTransition === 'function'
  // #endif

  return false
}

export function useViewTransition() {
  /** 包裹一个会改变 DOM 的异步操作；不支持时原样执行 */
  function startTransition<T>(callback: () => T | Promise<T>): Promise<T> {
    if (!isViewTransitionSupported()) {
      return Promise.resolve(callback())
    }

    let result: T
    const transition = (document as any).startViewTransition(async () => {
      result = await callback()
    })
    return transition.updateCallbackDone.then(() => result)
  }

  /**
   * 带转场的页面跳转。
   *
   * 必须 promise 化 `uni.navigateTo`：只有等 success 回调之后新页面才挂上，
   * 这时候 View Transitions 才能截到有意义的新快照。支持转场时同时关掉
   * uni 自带的滑入动画，避免两套动画叠加。
   *
   * @param beforeNavigate 在转场回调内、跳转之前执行。共享元素的
   * `view-transition-name` 必须在这里摘掉：同一个名字只能有一个元素持有，
   * 旧页面的卡片和新页面的图片同时带着它，浏览器会直接放弃整个转场。
   */
  function navigateWithTransition(url: string, beforeNavigate?: () => void): Promise<void> {
    const supported = isViewTransitionSupported()
    return startTransition(async () => {
      beforeNavigate?.()
      await nextTick()
      await new Promise<void>((resolve) => {
        uni.navigateTo({
          url,
          ...(supported ? { animationType: 'none' as const } : {}),
          success: () => resolve(),
          fail: (err) => {
            console.error('[nav] navigateTo failed:', url, err)
            uni.showToast({ title: '页面打开失败，请稍后重试', icon: 'none' })
            resolve()
          },
        })
      })
    })
  }

  return {
    startTransition,
    navigateWithTransition,
    isViewTransitionSupported,
  }
}
