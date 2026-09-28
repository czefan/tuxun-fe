import { environmentManager, focusManager, onlineManager, QueryClient } from '@tanstack/vue-query'
import { ApiRequestError } from '@/service/request/error'

// 1. 小程序运行环境适配：禁用 SSR 判定，激活焦点管理器
// #ifndef H5
environmentManager.setIsServer(() => false)
focusManager.setFocused(true)
// #endif

let networkVersion = 0

/** 前后台切换时重新探测，修正后台错过的联网事件。探测失败保留现有状态。 */
export function refreshNetworkStatus() {
  const version = ++networkVersion
  uni.getNetworkType({
    success: ({ networkType }) => {
      if (version === networkVersion) onlineManager.setOnline(networkType !== 'none')
    },
  })
}

// 2. 全应用仅保留一个网络监听，页面只订阅 onlineManager。
onlineManager.setEventListener((setOnline) => {
  setOnline(true)

  const handleNetworkChange = (res: { isConnected: boolean; networkType: string }) => {
    networkVersion++
    setOnline(Boolean(res.isConnected) && res.networkType !== 'none')
  }

  if (typeof uni !== 'undefined' && typeof uni.onNetworkStatusChange === 'function') {
    uni.onNetworkStatusChange(handleNetworkChange)
  }

  return () => {
    if (typeof uni !== 'undefined' && typeof uni.offNetworkStatusChange === 'function') {
      uni.offNetworkStatusChange(handleNetworkChange)
    }
  }
})

// 3. 全局 QueryClient 配置
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => {
        if (failureCount >= 1) return false
        if (error instanceof ApiRequestError) {
          // 参数 / 权限 / 业务限制不会因立即重试而恢复，只重试临时故障。
          if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) return false
          if (error.code !== undefined && [3, 5, 6, 7, 8, 9].includes(error.code)) return false
        }
        return true
      },
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
})
