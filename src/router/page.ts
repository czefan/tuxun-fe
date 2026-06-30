import type { PageMetaDatum, SubPackages } from '@uni-helper/vite-plugin-uni-pages'
import { pages, subPackages } from '@/pages.json'

export type PageInstance = Page.PageInstance<AnyObject, object> & {
  $page: Page.PageInstance<AnyObject, object> & { fullPath: string }
}

export function getLastPage() {
  const pages = getCurrentPages()
  return pages[pages.length - 1] as PageInstance
}

/**
 * 获取当前页面路由的 path 和 query。
 */
export function currRoute() {
  const lastPage = getLastPage() as PageInstance
  if (!lastPage) {
    return {
      path: '',
      query: {},
    }
  }

  return parseUrlToObj(lastPage.$page.fullPath)
}

export function ensureDecodeURIComponent(url: string) {
  if (url.startsWith('%')) {
    return ensureDecodeURIComponent(decodeURIComponent(url))
  }
  return url
}

/**
 * 解析 url 得到 path 和 query。
 */
export function parseUrlToObj(url: string) {
  const [path, queryStr] = url.split('?')

  if (!queryStr) {
    return {
      path,
      query: {},
    }
  }

  const query: Record<string, string> = {}
  queryStr.split('&').forEach((item) => {
    const [key, value] = item.split('=')
    query[key] = ensureDecodeURIComponent(value)
  })

  return { path, query }
}

function getSubPages(key?: string) {
  const result: PageMetaDatum[] = []
  ;(subPackages as SubPackages).forEach(({ root, pages }) => {
    pages
      .filter(page => !key || page[key])
      .forEach((page) => {
        result.push({
          ...page,
          path: `/${root}/${page.path}`,
        })
      })
  })
  return result
}

/**
 * 得到主包和分包的页面配置。传 key 时只返回配置了该字段的页面。
 */
export function getAllPages(key?: string) {
  const mainPages = (pages as PageMetaDatum[])
    .filter(page => !key || page[key])
    .map(page => ({
      ...page,
      path: `/${page.path}`,
    }))

  return [...mainPages, ...getSubPages(key)]
}

export function getCurrentPageI18nKey() {
  const { path } = currRoute()
  const currPage = getAllPages().find(page => page.path === path)

  if (!currPage) {
    console.warn('路由不正确')
    return ''
  }

  return currPage.style?.navigationBarTitleText || ''
}

/**
 * 首页路径，通过 pages.json 里 type 为 home 的页面获取；没有则默认第一个页面。
 */
export const HOME_PAGE = `/${
  (pages as PageMetaDatum[]).find(page => page.type === 'home')?.path || (pages as PageMetaDatum[])[0].path
}`
