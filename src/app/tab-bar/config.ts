import type { CustomTabBarItem, NativeTabBar, NativeTabBarItem, TabBarStrategy } from './types'

export const SELECTED_TABBAR_STRATEGY: TabBarStrategy = 'CUSTOM'

export const customTabBarList: CustomTabBarItem[] = [
  {
    pagePath: 'pages/index/index',
    text: '%tabbar.home%',
    icon: 'home',
    iconType: 'wd',
    iconActive: 'home-fill',
    iconActiveType: 'wd',
  },
  {
    pagePath: 'pages/activity/index',
    text: '%tabbar.activity%',
    icon: 'i-carbon-flag',
    iconType: 'unocss',
    iconActive: 'i-carbon-flag-filled',
    iconActiveType: 'unocss',
  },
  {
    type: 'publish',
  },
  {
    pagePath: 'pages/notice/index',
    text: '%tabbar.notice%',
    icon: 'i-carbon-notification',
    iconType: 'unocss',
    iconActive: 'i-carbon-notification-filled',
    iconActiveType: 'unocss',
  },
  {
    pagePath: 'pages/my/index',
    text: '%tabbar.my%',
    icon: 'i-carbon-user',
    iconType: 'unocss',
    iconActive: 'i-carbon-user-filled',
    iconActiveType: 'unocss',
  },
]

const nativeTabBarList: NativeTabBarItem[] = [
  { pagePath: 'pages/index/index', text: '首页' },
  { pagePath: 'pages/activity/index', text: '活动' },
  { pagePath: 'pages/notice/index', text: '通知' },
  { pagePath: 'pages/my/index', text: '我的' },
]

export const tabBar: NativeTabBar = {
  // 本项目用 SELECTED_TABBAR_STRATEGY = 'CUSTOM'，底栏由 main-tab-bar.vue 渲染。
  // 不加 custom 的话小程序会把原生底栏也画出来，屏幕底部叠两条。
  custom: SELECTED_TABBAR_STRATEGY === 'CUSTOM',
  color: '#999999',
  selectedColor: '#d4a017',
  backgroundColor: '#ffffff',
  borderStyle: 'black',
  list: nativeTabBarList,
}
