import { computed } from 'vue'

/**
 * 跨端吸顶 top 样式。
 * H5 需偏移原生导航栏高度（--window-top），小程序导航栏在 webview 之外无需偏移。
 */
export function useStickyTop(offsetPx = 0) {
  return computed(() => {
    // #ifdef H5
    return offsetPx > 0
      ? { top: `calc(var(--window-top, 0px) + ${offsetPx}px)` }
      : { top: 'var(--window-top, 0px)' }
    // #endif
    // #ifndef H5
    return offsetPx > 0
      ? { top: `${offsetPx}px` }
      : { top: '0px' }
    // #endif
  })
}

/**
 * 顶部下拉弹层（wd-popup position="top"）的顶部留白。
 *
 * H5 的导航栏画在页面内，弹层会盖住它，必须让出「状态栏 + 导航栏」；
 * 小程序导航栏在 webview 之外，页面原点已在其下方，只需常规内边距。
 */
export function usePopupTopPadding(h5NavBarPx = 60, mpPaddingPx = 20) {
  return computed(() => {
    // #ifdef H5
    return {
      paddingTop: `calc(var(--status-bar-height, 20px) + ${h5NavBarPx}px)`,
      closeTop: `calc(var(--status-bar-height, 20px) + ${h5NavBarPx - 8}px)`,
    }
    // #endif
    // #ifndef H5
    return {
      paddingTop: `${mpPaddingPx}px`,
      closeTop: `${mpPaddingPx - 8}px`,
    }
    // #endif
  })
}
