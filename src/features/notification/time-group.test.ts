import { describe, expect, it } from 'vitest'
import { groupItemsByTime } from './time-group'

describe('groupItemsByTime 时间分组', () => {
  it('空数组返回空列表', () => {
    expect(groupItemsByTime([])).toEqual([])
  })

  it('使用 rawCreatedAt ISO 时间戳正确分组', () => {
    const now = new Date()
    const isoNow = now.toISOString()
    const isoLastYear = new Date(now.getFullYear() - 1, 0, 1).toISOString()

    const items = [
      { id: 1, title: '现在', createdAt: '刚刚', rawCreatedAt: isoNow },
      { id: 2, title: '去年', createdAt: '去年', rawCreatedAt: isoLastYear },
    ]

    const groups = groupItemsByTime(items)
    expect(groups.length).toBeGreaterThanOrEqual(1)
    expect(groups.some((g) => g.title === '本周' && g.list.some((i) => i.id === 1))).toBe(true)
    expect(groups.some((g) => g.title === '更早' && g.list.some((i) => i.id === 2))).toBe(true)
  })

  it('相对时间文本（刚刚/今天/昨天）归入本周', () => {
    const items = [
      { id: 1, title: '刚刚发生', createdAt: '刚刚' },
      { id: 2, title: '今天发生', createdAt: '今天 12:00' },
      { id: 3, title: '昨天发生', createdAt: '昨天 18:30' },
    ]

    const groups = groupItemsByTime(items)
    expect(groups).toHaveLength(1)
    expect(groups[0].title).toBe('本周')
    expect(groups[0].list).toHaveLength(3)
  })

  it('缺少年份的 "MM-DD HH:mm" 格式不会被误解析为 2001 年导致错判', () => {
    const items = [{ id: 1, title: '相对时间', createdAt: '08-21 10:52' }]

    const groups = groupItemsByTime(items)
    // 无法精准推定年份时兜底归入「更早」，但不会产生 NaN 崩溃
    expect(groups).toHaveLength(1)
    expect(groups[0].title).toBe('更早')
    expect(groups[0].list[0].id).toBe(1)
  })

  it('所有解析失败的数据兜底归入更早', () => {
    const items = [
      { id: 1, title: '无效时间1', createdAt: 'invalid-date-string' },
      { id: 2, title: '无效时间2', createdAt: 'unknown' },
    ]

    const groups = groupItemsByTime(items)
    expect(groups).toHaveLength(1)
    expect(groups[0].title).toBe('更早')
    expect(groups[0].list).toHaveLength(2)
  })
})
