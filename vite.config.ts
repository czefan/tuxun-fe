import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import Uni from '@uni-helper/plugin-uni'
import { isMpWeixin } from '@uni-helper/uni-env'
import UniComponents from '@uni-helper/vite-plugin-uni-components'
// @see https://uni-helper.js.org/vite-plugin-uni-layouts
import UniLayouts from '@uni-helper/vite-plugin-uni-layouts'
// @see https://github.com/uni-helper/vite-plugin-uni-manifest
import UniManifest from '@uni-helper/vite-plugin-uni-manifest'
// @see https://uni-helper.js.org/vite-plugin-uni-pages
import UniPages from '@uni-helper/vite-plugin-uni-pages'
import { WotResolver } from './wot-ui-resolver'
// @see https://github.com/uni-helper/vite-plugin-uni-platform
// 需要与 @uni-helper/vite-plugin-uni-pages 插件一起使用
import UniPlatform from '@uni-helper/vite-plugin-uni-platform'

/**
 * 分包优化、模块异步跨包调用、组件异步跨包引用
 * @see https://github.com/uni-ku/bundle-optimizer
 */
import UniOptimization from '@uni-ku/bundle-optimizer'
// https://github.com/uni-ku/root
import UniKuRoot from '@uni-ku/root'
import dayjs from 'dayjs'
import { visualizer } from 'rollup-plugin-visualizer'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import type { Plugin } from 'vite'
import { defineConfig, loadEnv } from 'vite'
import ViteRestart from 'vite-plugin-restart'
import openDevTools from './scripts/open-dev-tools'
import vitePluginEruda from './scripts/vite-plugin-eruda'
import { createCopyNativeResourcesPlugin } from './vite-plugins/copy-native-resources'
import syncManifestPlugin from './vite-plugins/sync-manifest-plugins'

type PagesJsonItem = Record<string, unknown>

interface GeneratedPagesJson {
  pages?: PagesJsonItem[]
  subPackages?: Array<PagesJsonItem & { pages?: PagesJsonItem[] }>
  tabBar?: PagesJsonItem & { list?: PagesJsonItem[] }
  [key: string]: unknown
}

function dedupeByKey<T extends PagesJsonItem>(items: T[] | undefined, key: string) {
  if (!Array.isArray(items)) {
    return items
  }

  const result: T[] = []
  const indexByKey = new Map<string, number>()

  for (const item of items) {
    const value = item[key]

    if (typeof value !== 'string') {
      result.push(item)
      continue
    }

    const existingIndex = indexByKey.get(value)
    if (existingIndex === undefined) {
      indexByKey.set(value, result.length)
      result.push(item)
    }
    else {
      result[existingIndex] = item
    }
  }

  return result
}

function normalizeGeneratedPagesJson(rootDir: string) {
  const pagesJsonPath = path.resolve(rootDir, 'src/pages.json')

  if (!fs.existsSync(pagesJsonPath)) {
    return
  }

  const source = fs.readFileSync(pagesJsonPath, 'utf-8')
  const withoutLineComments = source.replace(/^\s*\/\/.*$/gm, '')
  let pagesJson: GeneratedPagesJson

  try {
    pagesJson = JSON.parse(withoutLineComments)
  }
  catch {
    return
  }

  pagesJson.pages = dedupeByKey(pagesJson.pages, 'path')
  pagesJson.subPackages = pagesJson.subPackages?.map(subPackage => ({
    ...subPackage,
    pages: dedupeByKey(subPackage.pages, 'path'),
  }))

  if (pagesJson.tabBar) {
    pagesJson.tabBar = {
      ...pagesJson.tabBar,
      list: dedupeByKey(pagesJson.tabBar.list, 'pagePath'),
    }
  }

  const normalized = `${JSON.stringify(pagesJson, null, 2)}\n`

  if (source !== normalized) {
    fs.writeFileSync(pagesJsonPath, normalized)
  }
}

function normalizePagesJsonPlugin(): Plugin {
  return {
    name: 'normalize-pages-json',
    configResolved(config) {
      normalizeGeneratedPagesJson(config.root)
    },
    buildStart() {
      normalizeGeneratedPagesJson(process.cwd())
    },
  }
}

function warnMissingProductionBaseUrl(env: Record<string, string>, platform: string | undefined, mode: string) {
  if (mode !== 'production') {
    return
  }

  const baseUrl = env.VITE_SERVER_BASEURL?.trim()

  if ((platform === 'mp-weixin' || platform === 'mp') && !baseUrl && !env.VITE_SERVER_BASEURL__WEIXIN_RELEASE?.trim()) {
    console.warn('[env] VITE_SERVER_BASEURL__WEIXIN_RELEASE is empty. Weixin release requests need an explicit HTTPS API domain.')
    return
  }

  if (platform && platform !== 'h5' && !baseUrl) {
    console.warn(`[env] VITE_SERVER_BASEURL is empty for production ${platform} build. Confirm this platform can request relative API paths.`)
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // @see https://unocss.dev/
  // const UnoCSS = (await import('unocss/vite')).default
  // console.log(mode === process.env.NODE_ENV) // true

  // mode: 区分生产环境还是开发环境
  // pnpm dev:h5 时得到 => serve development
  // pnpm build:h5 时得到 => build production
  // pnpm dev:mp-weixin 时得到 => build development (注意区别，command为build)
  // pnpm build:mp-weixin 时得到 => build production
  // pnpm dev:app 时得到 => build development (注意区别，command为build)
  // pnpm build:app 时得到 => build production
  // dev 和 build 命令可以分别使用 .env.development 和 .env.production 的环境变量
  // 非 H5 端 dev 也是 build command，最终加载哪个 env 文件以实际 mode 为准。

  const { UNI_PLATFORM, SKIP_OPEN_DEVTOOLS } = process.env

  const envDir = path.resolve(process.cwd(), 'env')
  const env = loadEnv(mode, envDir)
  const localEnv = loadEnv(mode, envDir, '')
  const {
    VITE_APP_PORT,
    VITE_SERVER_BASEURL,
    VITE_APP_TITLE,
    VITE_DELETE_CONSOLE,
    VITE_APP_PUBLIC_BASE,
    VITE_APP_PROXY_ENABLE,
    VITE_APP_PROXY_PREFIX,
    VITE_COPY_NATIVE_RES_ENABLE,
  } = env
  const { WECHAT_DEVTOOLS_CLI_PATH } = localEnv
  const bundleAnalyze = (process.env.VITE_BUNDLE_ANALYZE || env.VITE_BUNDLE_ANALYZE) === 'true'
  const bundleAnalyzeOpen = (process.env.VITE_BUNDLE_ANALYZE_OPEN || env.VITE_BUNDLE_ANALYZE_OPEN) === 'true'
  const bundleAnalyzePlatform = UNI_PLATFORM || 'h5'

  warnMissingProductionBaseUrl(env, UNI_PLATFORM, mode)
  normalizeGeneratedPagesJson(process.cwd())

  return defineConfig({
    envDir: './env', // 自定义env目录
    base: VITE_APP_PUBLIC_BASE,
    plugins: [
      // UniXXX 需要在 Uni 之前引入
      UniLayouts(),
      UniPlatform(),
      UniManifest(),
      UniComponents({
        extensions: ['vue'],
        deep: true, // 是否递归扫描子目录，
        directoryAsNamespace: false, // 是否把目录名作为命名空间前缀，true 时组件名为 目录名+组件名，
        dts: 'src/types/components.d.ts', // 自动生成的组件类型声明文件路径（用于 TypeScript 支持）
        resolvers: [WotResolver()],
      }),
      UniPages({
        exclude: [
          '**/components/**/**.*',
          '**/sections/**/**.*',
        ],
        // pages 目录为 src/pages，分包目录不能配置在pages目录下！！
        // 是个数组，可以配置多个，但是不能为pages里面的目录！！
        subPackages: ['src/subPages'],
        dts: 'src/types/uni-pages.d.ts',
      }),
      normalizePagesJsonPlugin(),
      // UniOptimization 插件需要 page.json 文件，故应在 UniPages 插件之后执行
      UniOptimization({
        enable: isMpWeixin,
        logger: false,
      }),
      // 若存在改变 pages.json 的插件，请将 UniKuRoot 放置其后
      UniKuRoot({
        excludePages: ['**/components/**/**.*', '**/sections/**/**.*'],
      }),
      Uni(),
      {
        // 临时解决 dcloudio 官方的 @dcloudio/uni-mp-compiler 出现的编译 BUG
        // 参考 github issue: https://github.com/dcloudio/uni-app/issues/4952
        // 自定义插件禁用 vite:vue 插件的 devToolsEnabled，强制编译 vue 模板时 inline 为 true
        name: 'fix-vite-plugin-vue',
        configResolved(config) {
          const plugin = config.plugins.find(p => p.name === 'vite:vue')
          if (plugin && plugin.api && plugin.api.options) {
            plugin.api.options.devToolsEnabled = false
          }
        },
      },
      {
        name: 'strip-json-comments',
        enforce: 'pre',
        resolveId(source, importer) {
          if (source.includes('pages.json')) {
            if (source.endsWith('pages.json.js')) {
              return source
            }
            return this.resolve(source, importer, { skipSelf: true }).then((resolved) => {
              if (resolved) {
                return `${resolved.id}.js`
              }
              return null
            })
          }
          return null
        },
        load(id) {
          if (id.endsWith('pages.json.js')) {
            const filePath = id.slice(0, -3)
            const code = fs.readFileSync(filePath, 'utf-8')
            const cleaned = code.replace(/^\s*\/\/.*$/gm, '')
            const obj = JSON.parse(cleaned)
            let jsCode = ''
            for (const [key, value] of Object.entries(obj)) {
              jsCode += `export const ${key} = ${JSON.stringify(value)};\n`
            }
            jsCode += `export default ${JSON.stringify(obj)};`
            return jsCode
          }
          return null
        },
      },
      UnoCSS(),
      AutoImport({
        imports: ['vue', 'uni-app'],
        dts: 'src/types/auto-import.d.ts',
        dirs: ['src/hooks'], // 自动导入 hooks
        vueTemplate: true, // default false
      }),
      ViteRestart({
        // 通过这个插件，在修改vite.config.js文件则不需要重新运行也生效配置
        restart: ['vite.config.js'],
      }),
      // h5环境增加 BUILD_TIME 和 BUILD_BRANCH
      UNI_PLATFORM === 'h5' && {
        name: 'html-transform',
        transformIndexHtml(html) {
          return html
            .replace('%BUILD_TIME%', dayjs().format('YYYY-MM-DD HH:mm:ss'))
            .replace('%VITE_APP_TITLE%', VITE_APP_TITLE)
        },
      },
      // 打包分析插件，显式开启后输出到 node_modules/.cache/visualizer
      bundleAnalyze
      && mode === 'production'
      && visualizer({
        filename: `./node_modules/.cache/visualizer/${bundleAnalyzePlatform}-stats.html`,
        open: bundleAnalyzeOpen,
        gzipSize: true,
        brotliSize: true,
      }),
      // 原生插件资源复制插件 - 仅在 app 平台且启用时生效
      createCopyNativeResourcesPlugin(
        UNI_PLATFORM === 'app' && VITE_COPY_NATIVE_RES_ENABLE === 'true',
        {
          verbose: mode === 'development', // 开发模式显示详细日志
        },
      ),
      syncManifestPlugin(),
      vitePluginEruda({
        open: UNI_PLATFORM === 'h5' && mode === 'development',
      }),
      // 自动打开开发者工具插件 (必须修改 .env 文件中的 VITE_WX_APPID)
      // 上传时通过 SKIP_OPEN_DEVTOOLS=true 跳过
      SKIP_OPEN_DEVTOOLS !== 'true' && openDevTools({
        mode,
        wechatDevtoolsCliPath: WECHAT_DEVTOOLS_CLI_PATH,
      }),
    ],
    define: {
      __VITE_APP_PROXY__: JSON.stringify(VITE_APP_PROXY_ENABLE),
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          silenceDeprecations: ['import', 'global-builtin', 'color-functions'],
        },
      },
      postcss: {
        plugins: [
          // autoprefixer({
          //   // 指定目标浏览器
          //   overrideBrowserslist: ['> 1%', 'last 2 versions'],
          // }),
        ],
      },
    },

    resolve: {
      alias: {
        '@': path.join(process.cwd(), './src'),
        '@img': path.join(process.cwd(), './src/static/images'),
        '@intlify/message-compiler': path.join(process.cwd(), './node_modules/@intlify/message-compiler'),
        '@intlify/shared': path.join(process.cwd(), './node_modules/@intlify/shared'),
      },
    },
    server: {
      host: '0.0.0.0',
      hmr: true,
      port: Number.parseInt(VITE_APP_PORT, 10),
      // 仅 H5 端生效，其他端不生效（其他端走build，不走devServer)
      proxy: JSON.parse(VITE_APP_PROXY_ENABLE)
        ? {
            [VITE_APP_PROXY_PREFIX]: {
              target: VITE_SERVER_BASEURL,
              changeOrigin: true,
              // 后端有/api前缀则不做处理，没有则需要去掉
              rewrite: path =>
                path.replace(new RegExp(`^${VITE_APP_PROXY_PREFIX}`), ''),
            },
          }
        : undefined,
    },
    esbuild: {
      drop: VITE_DELETE_CONSOLE === 'true' ? ['console', 'debugger'] : [],
    },
    build: {
      sourcemap: false,
      // 方便非h5端调试
      // sourcemap: VITE_SHOW_SOURCEMAP === 'true', // 默认是false
      target: 'es6',
      // 开发环境不用压缩
      minify: mode === 'development' ? false : 'esbuild',
    },
  })
})
