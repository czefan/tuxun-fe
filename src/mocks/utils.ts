/**
 * Mock 助手工具函数：处理 URL 分页与过滤助手
 */

export interface PaginationParams {
  page: number
  pageSize: number
}

export function parsePaginationParams(urlStr: string): PaginationParams {
  const url = new URL(urlStr, 'http://localhost')
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
  const pageSize = Math.max(1, Math.min(100, Number(url.searchParams.get('page_size')) || 20))
  return { page, pageSize }
}

export function paginateArray<T>(list: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize
  return list.slice(start, start + pageSize)
}
