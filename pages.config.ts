import { defineUniPages } from '@uni-helper/vite-plugin-uni-pages'
import { tabBar } from './src/app/tab-bar/config'

export default defineUniPages({
  globalStyle: {
    navigationBarTextStyle: 'white',
    navigationBarTitleText: '图寻',
    navigationBarBackgroundColor: '#B69171',
    backgroundColor: '#F1DFC5',
  },
  preloadRule: {
    'pages/index/index': {
      network: 'all',
      packages: ['subPages'],
    },
  },
  // tabbar 的配置统一在 “./src/app/tab-bar/config.ts” 文件中
  tabBar: tabBar as any,
})
