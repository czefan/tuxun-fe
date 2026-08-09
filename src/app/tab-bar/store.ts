import { computed, ref } from 'vue'
import { customTabBarList } from './config'

const currentPagePath = ref('')

/** 归一化路由路径：去掉 query，补前导斜杠 */
function normalizeRoutePath(path?: string) {
  if (!path) {
    return ''
  }
  const pure = path.split('?')[0]
  const normalized = pure.startsWith('/') ? pure : `/${pure}`
  return (normalized === '/' || normalized === '') ? '/pages/index/index' : normalized
}

/** 该路径是否是 tabbar 页；底栏据此决定是否渲染，分包详情页不显示底栏 */
export function isTabBarPage(path?: string) {
  const target = normalizeRoutePath(path)
  if (!target) {
    // 拿不到路由时按「非 tabbar 页」处理：宁可少画底栏，也不能让详情页冒出底栏
    return false
  }
  return customTabBarList.some(item => item.pagePath && normalizeRoutePath(item.pagePath) === target)
}

export function useTabBarStore() {
  function setCurrentPagePath(path: string) {
    currentPagePath.value = normalizeRoutePath(path)
  }

  /** 由当前真实路由反查 tab 页，同步高亮 pagePath（区别于按下标，避免 minLevel 过滤后错位） */
  function syncCurrentPagePathAsync() {
    try {
      const pages = getCurrentPages()
      if (pages.length > 0) {
        const currentPage = pages[pages.length - 1]
        const rawRoute = currentPage.route || (currentPage as any).$page?.fullPath || ''
        const routePath = normalizeRoutePath(rawRoute)
        if (!routePath) {
          return
        }
        const found = customTabBarList.find(
          item => item.pagePath && normalizeRoutePath(item.pagePath) === routePath,
        )
        if (found?.pagePath) {
          currentPagePath.value = normalizeRoutePath(found.pagePath)
        }
      }
    }
    catch {
      // 忽略 App 初始化极端抓取情况
    }
  }

  return {
    currentPagePath: computed(() => currentPagePath.value),
    setCurrentPagePath,
    syncCurrentPagePathAsync,
  }
}
