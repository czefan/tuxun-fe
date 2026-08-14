import path from 'node:path'
import process from 'node:process'
// manifest.config.ts
import { defineManifestConfig } from '@uni-helper/vite-plugin-uni-manifest'
import { loadEnv } from 'vite'

// 手动解析命令行参数获取 mode
function getMode() {
  const args = process.argv.slice(2)
  const modeFlagIndex = args.findIndex(arg => arg === '--mode')
  return modeFlagIndex !== -1 ? args[modeFlagIndex + 1] : args[0] === 'build' ? 'production' : 'development' // 默认 development
}
// 获取环境变量的范例
const env = loadEnv(getMode(), path.resolve(process.cwd(), 'env'))
const {
  VITE_APP_TITLE,
  VITE_UNI_APPID,
  VITE_WX_APPID,
  VITE_APP_PUBLIC_BASE,
  VITE_FALLBACK_LOCALE,
  VITE_AMAP_KEY,
  VITE_AMAP_SECURITY_JSCODE,
  VITE_AMAP_SERVICE_HOST,
} = env
const isProduction = getMode() === 'production'
// console.log('manifest.config.ts env:', env)

export default defineManifestConfig({
  'name': VITE_APP_TITLE,
  'appid': VITE_UNI_APPID,
  'description': '',
  'versionName': '1.0.0',
  'versionCode': '100',
  'transformPx': false,
  'locale': VITE_FALLBACK_LOCALE || 'zh-Hans',
  'fallbackLocale': VITE_FALLBACK_LOCALE || 'zh-Hans',
  'uniStatistics': {
    enable: false,
    version: '2',
  },
  'h5': {
    uniStatistics: {
      enable: false,
    },
    router: {
      mode: 'history',
      base: VITE_APP_PUBLIC_BASE,
    },
    sdkConfigs: {
      maps: {
        amap: {
          key: VITE_AMAP_KEY || '',
          securityJsCode: VITE_AMAP_SECURITY_JSCODE || '',
          serviceHost: VITE_AMAP_SERVICE_HOST || '',
        },
      },
    },
  },
  /* 微信小程序特有相关 */
  'mp-weixin': {
    appid: VITE_WX_APPID,
    uniStatistics: {
      enable: false,
    },
    lazyCodeLoading: 'requiredComponents',
    setting: {
      urlCheck: isProduction,
      // 是否启用 ES6 转 ES5
      es6: true,
      minified: true,
    },
    optimization: {
      subPackages: true,
    },
    // 是否合并组件虚拟节点外层属性，uni-app 3.5.1+ 开始支持。目前仅支持 style、class 属性。
    // 默认不开启（undefined），这里设置为开启。
    mergeVirtualHostAttributes: true,
    // styleIsolation: 'shared',
    usingComponents: true,
    // __usePrivacyCheck__: true,
    permission: {
      'scope.userLocation': { desc: '用于标注题目拍摄位置与提交作答坐标' },
    },
    requiredPrivateInfos: ['getLocation', 'chooseLocation'],
  },
  'vueVersion': '3',
})
