export interface CustomTabBarItem {
  pagePath?: string
  text?: string
  icon?: string
  iconType?: 'wd' | 'unocss'
  iconActive?: string
  iconActiveType?: 'wd' | 'unocss'
  minLevel?: 1 | 2 | 3
  type?: 'publish'
}

export type TabBarStrategy = 'NATIVE' | 'CUSTOM' | 'AUTO'

export interface NativeTabBarItem {
  pagePath: string
  text: string
  iconPath?: string
  selectedIconPath?: string
}

export interface NativeTabBar {
  /**
   * 自定义底栏时必须为 true。
   * list 仍要保留：uni.switchTab 只认 pages.json 里声明过的 tabbar 页，
   * 清空 list 会让底栏切换全部失败。custom 负责让平台不再渲染原生那一条。
   */
  custom?: boolean
  color: string
  selectedColor: string
  backgroundColor: string
  borderStyle: 'black' | 'white'
  list: NativeTabBarItem[]
}
