let serverTimeOffset = 0
let hasWarnedMissingDate = false

/**
 * 根据响应头中的 Date 更新服务器时间偏移量
 */
export function updateServerTimeOffset(headerDate?: string | null) {
  if (!headerDate) {
    // 只在真实 H5 运行时提醒（单测环境不剥离条件编译，会刷屏）
    if (import.meta.env.DEV && import.meta.env.MODE !== 'test' && !hasWarnedMissingDate) {
      // #ifdef H5
      hasWarnedMissingDate = true
      console.warn('[ServerTime] 未从响应头读到 Date，请检查后端 Access-Control-Expose-Headers 是否配置 Date')
      // #endif
    }
    return
  }

  const serverTime = Date.parse(headerDate)
  if (!Number.isNaN(serverTime)) {
    serverTimeOffset = serverTime - Date.now()
  }
}

/**
 * 获取当前服务器基准时间戳（毫秒）
 */
export function serverNow(): number {
  return Date.now() + serverTimeOffset
}
