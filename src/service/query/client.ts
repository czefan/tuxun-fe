import { QueryClient } from '@tanstack/vue-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 默认 1 分钟缓存失效
      gcTime: 5 * 60_000, // 5 分钟垃圾回收
      retry: 1,
      refetchOnWindowFocus: false, // uni 环境无 window focus 语义
    },
  },
})
