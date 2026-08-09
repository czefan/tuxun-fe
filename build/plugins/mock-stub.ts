import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import type { Plugin } from 'vite'

const MOCK_ENTRY_SUFFIX = '/src/mocks/index.ts'
const WORKER_FILE = 'mockServiceWorker.js'

const NOOP_SOURCE = [
  'export async function enableMocking() {}',
  'export function ensureMockReady() { return Promise.resolve() }',
  'export function switchMockScenario() {}',
  'export function getCurrentMockScenario() { return "data" }',
  '',
].join('\n')

function workerPath() {
  return path.join(process.cwd(), 'public', WORKER_FILE)
}

/**
 * 关闭 mock 时把 mock 入口的内容换成空实现。
 *
 * 为什么必须在构建期做掉：rollup 会在 tree-shaking 之前解析动态 import 的
 * 目标并把整条依赖链拉进模块图，msw 及其 node 侧依赖（outvariant /
 * tough-cookie / @mswjs/* …）因此会出现在生产构建里——要么打进产物
 * （实测约 296 KB 的 mocks chunk），要么因为这些包不是直接依赖而报
 * "failed to resolve"。仅靠 `import.meta.env.VITE_ENABLE_MOCK` 判断没用。
 *
 * 用 `load` 而不是 `resolveId` / `resolve.alias`：
 * @dcloudio/vite-plugin-uni 会覆盖 alias，且它的 resolver 会先一步把这个
 * import 解析掉，pre 阶段的 resolveId 根本收不到（实测）。`load` 以最终
 * id 为准，不受解析顺序影响。
 *
 * NOOP_SOURCE 必须导出 mock 入口的**全部**具名导出，少一个，
 * 生产构建里对应的解构就会拿到 undefined。
 */
function stubPlugin(): Plugin {
  return {
    name: 'vite-plugin-mock-stub',
    enforce: 'pre',
    load(id) {
      const normalized = id.split('?')[0].replace(/\\/g, '/')
      return normalized.endsWith(MOCK_ENTRY_SUFFIX) ? NOOP_SOURCE : null
    },
  }
}

/**
 * 开启 mock 时把 msw 的 Service Worker 挂到站点根路径。
 *
 * @dcloudio/vite-plugin-uni 会把 `publicDir` 强制改成 '__static__'
 * （vite-plugin-uni/dist/config/index.js），所以根目录 public/ 既不会被
 * dev server 提供，也不会进产物。请求 /mockServiceWorker.js 会命中 SPA fallback
 * 拿到一份 text/html，浏览器以 "unsupported MIME type" 拒绝注册 Service Worker，
 * 于是 worker.start() 抛错、ensureMockReady() 每次都 reject，所有请求在发出前
 * 就失败——页面表现为卡住/空白。这里手动补上，且只在 mock 模式补，
 * 生产产物不会带上它。
 */
function workerPlugin(): Plugin {
  return {
    name: 'vite-plugin-mock-worker',
    enforce: 'pre',
    configureServer(server) {
      // 必须挂在最前面：uni 的 SPA fallback 中间件会把未知路径都吞成 index.html
      server.middlewares.use((req, res, next) => {
        if (!req.url || !req.url.split('?')[0].endsWith(`/${WORKER_FILE}`)) {
          return next()
        }
        const file = workerPath()
        if (!fs.existsSync(file)) {
          return next()
        }
        res.setHeader('Content-Type', 'application/javascript')
        res.setHeader('Service-Worker-Allowed', '/')
        res.end(fs.readFileSync(file))
      })
    },
    generateBundle() {
      const file = workerPath()
      if (!fs.existsSync(file)) {
        this.warn(`未找到 ${file}，mock 构建缺少 Service Worker，请求会全部失败`)
        return
      }
      this.emitFile({
        type: 'asset',
        fileName: WORKER_FILE,
        source: fs.readFileSync(file),
      })
    },
  }
}

export function mockStubPlugin(mockEnabled: boolean): Plugin[] {
  return mockEnabled ? [workerPlugin()] : [stubPlugin()]
}
