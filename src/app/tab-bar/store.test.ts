import { describe, expect, it } from 'vitest'
import { isTabBarPage } from './store'

describe('tabBarStore', () => {
  it('拿不到路由（空 path）时不能判成 tabbar 页，否则分包详情页会冒出底栏', () => {
    expect(isTabBarPage('')).toBe(false)
    expect(isTabBarPage(undefined)).toBe(false)
  })

  it('投稿哨兵项不参与路径匹配', () => {
    expect(isTabBarPage('/subPages/question/detail')).toBe(false)
    expect(isTabBarPage('/pages/index/index')).toBe(true)
  })

  it('线上 H5 根路径 / 必须按首页处理，否则线上底栏会消失', () => {
    expect(isTabBarPage('/')).toBe(true)
  })
})
