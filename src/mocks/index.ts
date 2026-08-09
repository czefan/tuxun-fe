/**
 * mock 启用入口。
 *
 * 这个文件**不能**静态 import `./browser` 或 `./data/db`：那样 msw 及其依赖会被
 * 固定进本模块所在的 chunk，无论开关是否打开都会打进生产产物（实测约 296 KB）。
 * 环境判断写在最前面，动态 import 放在后面，再配合 build/plugins/mock-stub.ts
 * 在非 mock 构建里把整个文件换掉。
 */

let mockPromise: Promise<void> | null = null

export async function enableMocking(): Promise<void> {
  if (import.meta.env.VITE_ENABLE_MOCK !== 'true') {
    return
  }

  if (!mockPromise) {
    mockPromise = (async () => {
      const { worker } = await import('./browser')
      await worker.start({
        onUnhandledRequest: 'bypass',
        serviceWorker: {
          url: '/mockServiceWorker.js',
        },
      })
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        await navigator.serviceWorker.ready
      }
    })()
  }

  return mockPromise
}

/**
 * 发请求前调用，确保 Service Worker 已经接管页面。
 *
 * 之前 main.ts 里是即发即忘地调 enableMocking()，首屏请求会跑在 worker
 * 激活之前，直接透传到真实网络拿 404——表现就是白屏。等这个 Promise 即可，
 * 不需要另写一套绕开 msw 的匹配逻辑。
 */
export function ensureMockReady(): Promise<void> {
  if (import.meta.env.VITE_ENABLE_MOCK !== 'true') {
    return Promise.resolve()
  }
  return enableMocking()
}

export async function switchMockScenario(scenario: 'data' | 'empty' | 'default'): Promise<void> {
  if (import.meta.env.VITE_ENABLE_MOCK !== 'true') {
    return
  }
  const { setScenario } = await import('./data/db')
  setScenario(scenario)
}

export async function getCurrentMockScenario(): Promise<string> {
  if (import.meta.env.VITE_ENABLE_MOCK !== 'true') {
    return 'data'
  }
  const { getActiveScenario } = await import('./data/db')
  return getActiveScenario()
}
