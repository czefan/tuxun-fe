import { useAuthStore } from '@/store/auth'
import { handleUnauthorized } from './shared'

/** Toast 去重栈：1.5s 内相同 Toast 不重复弹出 */
const toastStack = new Map<string, number>()
const TOAST_DEBOUNCE_MS = 1500

export function showToastDeduplicated(title: string) {
  if (!title)
    return
  const now = Date.now()
  const lastTime = toastStack.get(title)
  if (lastTime && now - lastTime < TOAST_DEBOUNCE_MS) {
    return
  }
  toastStack.set(title, now)

  // 清理过期记录
  if (toastStack.size > 20) {
    toastStack.forEach((t, k) => {
      if (now - t > TOAST_DEBOUNCE_MS) {
        toastStack.delete(k)
      }
    })
  }

  uni.showToast({
    icon: 'none',
    title,
  })
}

export interface ContractResponse<T = unknown> {
  success: boolean
  code: number
  message: string
  resp: T
}

/**
 * 契约统一错误码与 HTTP 状态码处理
 */
export function handleResponseError(
  statusCode: number,
  responseData?: Partial<ContractResponse>,
  hideErrorToast?: boolean,
  silentAuth?: boolean,
): { message: string, code: number } {
  const code = responseData?.code ?? -1
  const serverMessage = responseData?.message || ''

  // 1. HTTP 401 或 业务 code 6（未登录）
  if (statusCode === 401 || code === 6) {
    if (!silentAuth) {
      handleUnauthorized()
    }
    // 未登录静默引导，不弹 Toast
    return { message: serverMessage || '未登录', code: 6 }
  }

  // 2. HTTP 403 或 业务 code 7（账号已被封禁）
  if (statusCode === 403 || code === 7) {
    const authStore = useAuthStore()
    authStore.clearToken()
    const msg = serverMessage || '账号已被封禁'
    uni.showModal({
      title: '账号已被封禁',
      content: msg,
      showCancel: false,
      confirmText: '我知道了',
      confirmColor: '#B69171',
    })
    return { message: msg, code: 7 }
  }

  // 3. HTTP 404 (资源不存在)：不弹 Toast，抛给调用方处理空态
  if (statusCode === 404) {
    return { message: serverMessage || '资源不存在', code: 404 }
  }

  // 3. 业务错误码与 HTTP 状态码提示判定
  let displayMessage = serverMessage

  switch (code) {
    case 3: // 参数错误
      displayMessage = serverMessage || '请求参数错误'
      break
    case 4: // 系统错误
      displayMessage = '服务开小差了，稍后再试'
      break
    case 5: // 操作错误（如库存不足、次数超限等）
    case 7: // 权限不足
    case 8: // 冲突
    case 9: // 频率限制 (429)
      displayMessage = serverMessage || '操作受限，请稍后再试'
      break
    default:
      if (statusCode === 429) {
        displayMessage = serverMessage || '请求过于频繁，请稍后再试'
      }
      else if (!displayMessage) {
        displayMessage = '请求失败，请稍后再试'
      }
      break
  }

  if (!hideErrorToast && displayMessage) {
    showToastDeduplicated(displayMessage)
  }

  return { message: displayMessage, code: code !== -1 ? code : statusCode }
}
