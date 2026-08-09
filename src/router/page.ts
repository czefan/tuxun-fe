type PageInstance = Page.PageInstance<AnyObject, object> & {
  $page: Page.PageInstance<AnyObject, object> & { fullPath: string }
}

/**
 * 获取当前页面路由的 path 和 query。
 */
export function currRoute() {
  const pages = getCurrentPages()
  const lastPage = pages[pages.length - 1] as PageInstance
  if (!lastPage?.$page?.fullPath) {
    return {
      path: '',
      query: {},
    }
  }

  const [path, queryStr] = lastPage.$page.fullPath.split('?')
  const query: Record<string, string> = {}

  if (queryStr) {
    queryStr.split('&').forEach((item) => {
      const [key, value] = item.split('=')
      if (key) {
        let val = value || ''
        while (val.startsWith('%')) {
          try {
            val = decodeURIComponent(val)
          }
          catch {
            break
          }
        }
        query[key] = val
      }
    })
  }

  return { path, query }
}
