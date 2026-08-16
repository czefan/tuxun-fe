import './utils/polyfill'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { createSSRApp } from 'vue'
import App from './App.vue'
import { initLocale } from './locale'
import { routeInterceptor } from './router/guard'
import { queryClient } from './service/query/client'
import { requestInterceptor } from './service/request/interceptor'

import store from './store'
import 'virtual:uno.css'

export function createApp() {
  initLocale()
  const app = createSSRApp(App)
  app.use(store)
  app.use(routeInterceptor)
  app.use(requestInterceptor)
  // 必须安装：所有页面都用 useQuery，
  // 缺少 provide 时 useQueryClient 会在页面挂载时直接抛错
  app.use(VueQueryPlugin, { queryClient })

  // #ifdef H5
  if (import.meta.env.VITE_ENABLE_MOCK === 'true') {
    import('@/mocks').then(({ enableMocking }) => {
      void enableMocking()
    })
  }
  // #endif

  return {
    app,
  }
}
