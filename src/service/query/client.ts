import { environmentManager } from '@tanstack/query-core'
import { focusManager, onlineManager, QueryClient } from '@tanstack/vue-query'

// 1. 小程序运行环境适配：禁用 SSR 判定，激活焦点管理器
// #ifndef H5
environmentManager.setIsServer(() => false)
focusManager.setFocused(true)
// #endif

// 2. 初始网络状态 fail-open
onlineManager.setEventListener((setOnline) => {
  setOnline(true)

  const handleNetworkChange = (res: { isConnected: boolean, networkType: string }) => {
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
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    mutations: {
      retry: 0,
    },
  },
})
