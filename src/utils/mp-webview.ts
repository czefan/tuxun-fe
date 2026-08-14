/**
 * 小程序 `<web-view>` 宿主通信工具（仅 H5 侧使用）。
 *
 * 背景：登录与登出流程均已改造为静态中转页（`/static/mp-auth-relay.html` 与 `/static/mp-logout-relay.html`）
 * 通过静态落地页与微信 JS-SDK 通知宿主小程序返回原生页面。
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
function isInMiniProgramWebview(): boolean {
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
