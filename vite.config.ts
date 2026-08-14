import path from 'node:path'
import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import { warnMissingProductionBaseUrl } from './build/env'
import { createVitePlugins } from './build/plugins'
import { normalizeGeneratedPagesJson } from './build/plugins/normalize-pages-json'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const { UNI_PLATFORM, SKIP_OPEN_DEVTOOLS } = process.env

  const envDir = path.resolve(process.cwd(), 'env')
  const env = loadEnv(mode, envDir, '')
  const {
    VITE_APP_PORT,
    VITE_SERVER_BASEURL,
    VITE_APP_TITLE,
    VITE_DELETE_CONSOLE,
    VITE_APP_PUBLIC_BASE,
    VITE_APP_PROXY_ENABLE,
    VITE_APP_PROXY_PREFIX,
    VITE_SHOW_SOURCEMAP,
    WECHAT_DEVTOOLS_CLI_PATH,
  } = env
  const mockEnabled = env.VITE_ENABLE_MOCK === 'true'
  const bundleAnalyze = (process.env.VITE_BUNDLE_ANALYZE || env.VITE_BUNDLE_ANALYZE) === 'true'
  const bundleAnalyzeOpen = (process.env.VITE_BUNDLE_ANALYZE_OPEN || env.VITE_BUNDLE_ANALYZE_OPEN) === 'true'

  warnMissingProductionBaseUrl(env, UNI_PLATFORM, mode)
  normalizeGeneratedPagesJson(process.cwd())

  return defineConfig({
    envDir: './env',
    base: VITE_APP_PUBLIC_BASE,
    plugins: createVitePlugins({
      mode,
      uniPlatform: UNI_PLATFORM,
      skipOpenDevTools: SKIP_OPEN_DEVTOOLS,
      bundleAnalyze,
      bundleAnalyzeOpen,
      wechatDevtoolsCliPath: WECHAT_DEVTOOLS_CLI_PATH,
      viteAppTitle: VITE_APP_TITLE,
      mockEnabled,
      erudaEnabled: env.VITE_APP_ERUDA === 'true',
    }),
    define: {
      __VITE_APP_PROXY__: JSON.stringify(VITE_APP_PROXY_ENABLE),
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'legacy-js-api'],
        },
      },
    },
    resolve: {
      alias: {
        '@': path.join(process.cwd(), './src'),
        '@img': path.join(process.cwd(), './src/static/images'),
      },
    },
    server: {
      host: '0.0.0.0',
      hmr: true,
      port: Number.parseInt(VITE_APP_PORT, 10),
      open: true,
      proxy: JSON.parse(VITE_APP_PROXY_ENABLE)
        ? {
            [VITE_APP_PROXY_PREFIX]: {
              target: VITE_SERVER_BASEURL || 'http://localhost:8088',
              changeOrigin: true,
              secure: false,
              rewrite: path => path.replace(new RegExp(`^${VITE_APP_PROXY_PREFIX}`), ''),
              configure: (proxy) => {
                proxy.on('proxyReq', (proxyReq) => {
                  if (!proxyReq.getHeader('host')) {
                    proxyReq.setHeader('host', 'localhost:8088')
                  }
                })
              },
            },
          }
        : undefined,
    },
    esbuild: {
      // 保留 console：线上排障时 uni 运行时与应用自身的报错是关键线索，
      // 全量 drop 会让「导航失效」这类问题完全无迹可寻。
      drop: VITE_DELETE_CONSOLE === 'true' ? ['debugger'] : [],
    },
    optimizeDeps: {
      // uni 自己把 vue / vue-router / pinia / @dcloudio/* 排除在预打包之外，
      // 这部分动不了。但下面这些不在它的排除清单里，却仍被逐文件裸发
      // （实测 @wot-ui/ui 15 个、@vue/devtools-api 26 个请求），显式预打包。
      include: ['@wot-ui/ui', '@vue/devtools-api'],
      // 不要把 graphql 加进 exclude：它是 msw 的直接依赖，预打包后是一个
      // 472KB 的 chunk；一旦排除，dev 会改成裸发 150 个文件 / 4.12MB（实测）。
      // 代价只是 dev 启动时几行 "graphql/xxx does not exist" 告警，不影响运行。
    },
    build: {
      // 由 env 控制：VITE_SHOW_SOURCEMAP === 'true' 时产出 sourcemap，默认关闭
      sourcemap: VITE_SHOW_SOURCEMAP === 'true',
      target: 'es6',
      minify: (mode === 'development' || mode === 'dev') ? false : 'esbuild',
    },
  })
})
