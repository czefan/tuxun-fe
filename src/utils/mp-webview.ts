/**
 * 小程序 `<web-view>` 宿主通信（仅 H5 侧使用）。
 *
 * 背景：小程序端没有 cookie，登录态只能靠 `X-Session-Id`（契约的 `sessionIdAuth`）。
 * 拿 session_id 的唯一路径是把统一身份认证页塞进 `<web-view>`，由内部的 H5 回调页
 * 换到 session_id 后回传给小程序。
 *
 * 两个必须知道的微信限制：
 *
 * 1. **`wx.miniProgram` 不是自带的。** 它来自微信 JS-SDK（jweixin），H5 页面不引入
 *    就恒为 `undefined`——「写了 postMessage 但小程序永远收不到」就是这么来的。
 *    这里按需从微信官方 CDN 动态加载，普通 H5 用户不会为此付出任何体积。
 *    （postMessage / navigateBack 属于 miniProgram 命名空间，**不需要** `wx.config` 签名。）
 * 2. **postMessage 不是实时的。** 消息只在 web-view 销毁（后退 / 组件销毁 / 分享）时
 *    才批量投递给小程序。所以必须 postMessage 之后**主动** navigateBack 触发投递，
 *    不能指望小程序端边等边收。
 */

const JSSDK_URL = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js'

interface MiniProgramBridge {
  postMessage: (options: { data: unknown }) => void
  navigateBack: (options?: { delta?: number }) => void
  reLaunch: (options: { url: string }) => void
}

function getBridge(): MiniProgramBridge | null {
  const wx = (globalThis as any).wx
  return wx?.miniProgram ?? null
}

/** 当前 H5 是否跑在微信小程序的 `<web-view>` 里 */
export function isInMiniProgramWebview(): boolean {
  const ua = (globalThis as any).navigator?.userAgent
  if (typeof ua !== 'string') {
    return false
  }
  return /miniprogram/i.test(ua) || (globalThis as any).__wxjs_environment === 'miniprogram'
}

function loadJssdk(): Promise<MiniProgramBridge | null> {
  const existing = getBridge()
  if (existing) {
    return Promise.resolve(existing)
  }

  const doc = (globalThis as any).document
  if (!doc) {
    return Promise.resolve(null)
  }

  return new Promise((resolve) => {
    const script = doc.createElement('script')
    script.src = JSSDK_URL
    script.onload = () => resolve(getBridge())
    script.onerror = () => resolve(null)
    doc.head.appendChild(script)
  })
}

/**
 * 把 session_id 回传给小程序宿主并触发返回。
 *
 * @returns 是否成功交给了小程序。false 表示不在 web-view 里、或 JSSDK 加载失败，
 *          调用方应回落到普通 H5 的跳转逻辑。
 */
export async function postSessionToMiniProgram(sessionId: string): Promise<boolean> {
  if (!sessionId || !isInMiniProgramWebview()) {
    return false
  }

  const bridge = await loadJssdk()
  if (!bridge) {
    return false
  }

  // 这是微信 miniProgram 的通道，不是 window.postMessage，没有 targetOrigin 参数
  // oxlint-disable-next-line unicorn/require-post-message-target-origin
  bridge.postMessage({ data: { sessionId } })
  // navigateBack 会销毁 web-view，这一步才真正触发上面那条消息的投递
  bridge.navigateBack()
  return true
}

/** 登出完成后回小程序首页。reLaunch 而非 navigateBack：宿主页是登出中转，不该留在栈里 */
export async function relaunchMiniProgram(url = '/pages/index/index'): Promise<boolean> {
  if (!isInMiniProgramWebview()) {
    return false
  }
  const bridge = await loadJssdk()
  if (!bridge) {
    return false
  }
  bridge.reLaunch({ url })
  return true
}
