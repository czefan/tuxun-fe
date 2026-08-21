import { withQuery } from 'ufo'
import { useAuthStore } from '@/store/auth'
import type { CustomRequestOptions } from './types'

// 拦截器配置
const httpInterceptor = {
  // 拦截前触发
  invoke(options: CustomRequestOptions) {
    // 接口请求支持通过 query 参数配置 queryString
    if (options.query) {
      options.url = withQuery(options.url, options.query)
    }
    // 1. 请求超时
    options.timeout = 60000 // 60s
    // 2. 跨端 Session/Cookie 鉴权
    const authStore = useAuthStore()
    const headers: Record<string, string> = { ...options.header }
    if (options.auth !== false && authStore.sessionId) {
      headers['X-Session-Id'] = authStore.sessionId
    }
    options.header = headers
    // 3. Session/Cookie 鉴权。H5 跨域调试时需要携带 Cookie。
    ;(options as CustomRequestOptions & { withCredentials?: boolean }).withCredentials = options.auth !== false
    return options
  },
}

export const requestInterceptor = {
  install() {
    // 拦截 request 请求
    uni.addInterceptor('request', httpInterceptor)
    // 拦截 uploadFile 文件上传
    uni.addInterceptor('uploadFile', httpInterceptor)
  },
}
