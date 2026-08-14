import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { t } from './index'

describe('locale 多语言模块', () => {
  const originalNavigator = globalThis.navigator

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true,
    })
  })

  it('英文环境下正确翻译为英文', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { language: 'en-US' },
      configurable: true,
      writable: true,
    })

    expect(t('tabbar.home')).toBe('Home')
    expect(t('page.questionDetail')).toBe('Question Details')
  })

  it('中文环境下正确翻译为中文', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { language: 'zh-CN' },
      configurable: true,
      writable: true,
    })

    expect(t('tabbar.home')).toBe('首页')
    expect(t('page.questionDetail')).toBe('题目详情')
  })

  describe('小程序环境（无 navigator，依赖 uni.getLocale）', () => {
    beforeEach(() => {
      Object.defineProperty(globalThis, 'navigator', {
        value: undefined,
        configurable: true,
        writable: true,
      })
    })

    it('小程序英文系统语言下翻译为英文', () => {
      ;(globalThis as any).uni = {
        getLocale: () => 'en',
      }
      expect(t('tabbar.home')).toBe('Home')
      expect(t('page.questionDetail')).toBe('Question Details')
    })

    it('小程序中文系统语言下翻译为中文', () => {
      ;(globalThis as any).uni = {
        getLocale: () => 'zh-Hans',
      }
      expect(t('tabbar.home')).toBe('首页')
      expect(t('page.questionDetail')).toBe('题目详情')
    })

    it('小程序未知/空语言下安全回退为中文', () => {
      ;(globalThis as any).uni = {
        getLocale: () => undefined,
      }
      expect(t('tabbar.home')).toBe('首页')
      expect(t('page.questionDetail')).toBe('题目详情')
    })
  })
})
