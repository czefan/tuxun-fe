export interface TimeGroup<T> {
  title: string
  list: T[]
}

/**
 * 按照消息/通知的时间将列表归类到「本周」、「本月」、「更早」分组中。
 */
export function groupItemsByTime<T extends { createdAt: string; rawCreatedAt?: string }>(
  items: T[],
): TimeGroup<T>[] {
  if (!items || items.length === 0) return []

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay()
  const thisWeekStart = todayStart - (dayOfWeek - 1) * 86400000
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()

  const getTimestamp = (item: T): number => {
    if (item.rawCreatedAt) {
      const t = new Date(item.rawCreatedAt).getTime()
      if (!Number.isNaN(t)) return t
    }
    if (typeof item.createdAt === 'string') {
      if (item.createdAt.includes('刚刚') || item.createdAt.includes('今天')) return Date.now()
      if (item.createdAt.includes('昨天')) return Date.now() - 86400000
    }
    const t = new Date(item.createdAt).getTime()
    // 相对字符串 "MM-DD HH:mm" 会被 new Date() 误解析成 2001 年，视为无效，避免分错组
    if (!Number.isNaN(t)) {
      const parsedYear = new Date(t).getFullYear()
      if (!(parsedYear === 2001 && !item.createdAt.includes('2001'))) return t
    }
    return 0
  }

  const sorted = [...items].sort((a, b) => getTimestamp(b) - getTimestamp(a))

  const thisWeek: T[] = []
  const thisMonth: T[] = []
  const earlier: T[] = []

  sorted.forEach((item) => {
    const time = getTimestamp(item)
    if (time >= thisWeekStart) {
      thisWeek.push(item)
    } else if (time >= thisMonthStart) {
      thisMonth.push(item)
    } else {
      earlier.push(item)
    }
  })

  const result: TimeGroup<T>[] = []
  if (thisWeek.length > 0) result.push({ title: '本周', list: thisWeek })
  if (thisMonth.length > 0) result.push({ title: '本月', list: thisMonth })
  if (earlier.length > 0) result.push({ title: '更早', list: earlier })

  if (result.length === 0 && items.length > 0) {
    result.push({ title: '更早', list: items })
  }

  return result
}
