import fs from 'node:fs'
import Uni from '@uni-helper/plugin-uni'
import { isMpWeixin } from '@uni-helper/uni-env'
import UniComponents from '@uni-helper/vite-plugin-uni-components'
import UniManifest from '@uni-helper/vite-plugin-uni-manifest'
import UniPages from '@uni-helper/vite-plugin-uni-pages'
import UniPlatform from '@uni-helper/vite-plugin-uni-platform'
import UniOptimization from '@uni-ku/bundle-optimizer'
import UniKuRoot from '@uni-ku/root'
import dayjs from 'dayjs'
import { visualizer } from 'rollup-plugin-visualizer'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import type { PluginOption } from 'vite'
import { WotResolver } from '../../wot-ui-resolver'
import openDevTools from '../../scripts/open-dev-tools'
import { vitePluginEruda } from './eruda'
import { mockStubPlugin } from './mock-stub'
import { normalizePagesJsonPlugin } from './normalize-pages-json'

interface PluginConfigOptions {
  mode: string
  uniPlatform?: string
  skipOpenDevTools?: string
  bundleAnalyze: boolean
  bundleAnalyzeOpen: boolean
  wechatDevtoolsCliPath?: string
  viteAppTitle: string
  mockEnabled: boolean
  erudaEnabled: boolean
}

export function createVitePlugins(options: PluginConfigOptions): PluginOption[] {
  const {
    mode,
    uniPlatform,
    skipOpenDevTools,
    bundleAnalyze,
    bundleAnalyzeOpen,
    wechatDevtoolsCliPath,
    viteAppTitle,
    mockEnabled,
    erudaEnabled,
  } = options

  const bundleAnalyzePlatform = uniPlatform || 'h5'

  return [
    ...mockStubPlugin(mockEnabled),
    UniPlatform(),
    UniManifest(),
    UniComponents({
      extensions: ['vue'],
      deep: true,
      directoryAsNamespace: false,
      dts: 'src/types/components.d.ts',
      resolvers: [WotResolver()],
    }),
    UniPages({
      exclude: ['**/components/**/**.*', '**/sections/**/**.*'],
      subPackages: ['src/subPages'],
      dts: 'src/types/uni-pages.d.ts',
    }),
    normalizePagesJsonPlugin(),
    UniOptimization({
      enable: isMpWeixin,
      logger: false,
    }),
    UniKuRoot({
      excludePages: ['**/components/**/**.*', '**/sections/**/**.*'],
    }),
    Uni(),
    {
      name: 'fix-vite-plugin-vue',
      configResolved(config: any) {
        const plugin = config.plugins.find((p: any) => p.name === 'vite:vue')
        if (plugin && plugin.api && plugin.api.options) {
          plugin.api.options.devToolsEnabled = false
        }
      },
    },
    {
      name: 'strip-json-comments',
      enforce: 'pre',
      resolveId(source: string, importer?: string) {
        if (source.includes('pages.json')) {
          if (source.endsWith('pages.json.js')) {
            return source
          }
          return (this as any).resolve(source, importer, { skipSelf: true }).then((resolved: any) => {
            if (resolved) {
              return `${resolved.id}.js`
            }
            return null
          })
        }
        return null
      },
      load(id: string) {
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
      vueTemplate: true,
    }),
    uniPlatform === 'h5' && {
      name: 'html-transform',
      transformIndexHtml(html: string) {
        return html
          .replace('%BUILD_TIME%', dayjs().format('YYYY-MM-DD HH:mm:ss'))
          .replace('%VITE_APP_TITLE%', viteAppTitle)
      },
    },
    bundleAnalyze
    && mode === 'production'
    && visualizer({
      filename: `./node_modules/.cache/visualizer/${bundleAnalyzePlatform}-stats.html`,
      open: bundleAnalyzeOpen,
      gzipSize: true,
      brotliSize: true,
    }),
    vitePluginEruda({
      open: uniPlatform === 'h5' && erudaEnabled,
    }),
    skipOpenDevTools !== 'true' && openDevTools({
      mode,
      wechatDevtoolsCliPath: wechatDevtoolsCliPath || '',
    }),
  ].filter(Boolean) as PluginOption[]
}
