import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import dayjs from 'dayjs'
import { formatDate, formatRelativeTime } from './date'

describe('formatRelativeTime & formatDate 日期时间格式化', () => {
  const baseTime = dayjs('2026-08-15 14:00:00')

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(baseTime.toDate())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('空值与非法输入', () => {
    expect(formatRelativeTime(null)).toBe('')
    expect(formatRelativeTime(undefined)).toBe('')
    expect(formatRelativeTime('')).toBe('')
    expect(formatRelativeTime('not-a-date')).toBe('not-a-date')
  })

  it('1 分钟以内：过去显示「刚刚」，未来显示「即将开始」', () => {
    // 30秒前 (过去)
    expect(formatRelativeTime(baseTime.subtract(30, 'second').toISOString())).toBe('刚刚')
    // 20秒后 (未来)
    expect(formatRelativeTime(baseTime.add(20, 'second').toISOString())).toBe('即将开始')
  })

  it('1 小时以内：过去显示「X分钟前」，未来显示「X分钟后」', () => {
    expect(formatRelativeTime(baseTime.subtract(5, 'minute').toISOString())).toBe('5分钟前')
    expect(formatRelativeTime(baseTime.subtract(59, 'minute').toISOString())).toBe('59分钟前')
    expect(formatRelativeTime(baseTime.add(5, 'minute').toISOString())).toBe('5分钟后')
    expect(formatRelativeTime(baseTime.add(45, 'minute').toISOString())).toBe('45分钟后')
  })

  it('今天其它时间（超过1小时的过去或稍后）显示「今天 HH:mm」', () => {
    expect(formatRelativeTime(baseTime.subtract(3, 'hour').toISOString())).toBe('今天 11:00')
    expect(formatRelativeTime(baseTime.add(3, 'hour').toISOString())).toBe('今天 17:00')
  })

  it('昨天显示「昨天 HH:mm」', () => {
    const yesterday = baseTime.subtract(1, 'day').set('hour', 9).set('minute', 30)
    expect(formatRelativeTime(yesterday.toISOString())).toBe('昨天 09:30')
  })

  it('明天显示「明天 HH:mm」', () => {
    const tomorrow = baseTime.add(1, 'day').set('hour', 10).set('minute', 15)
    expect(formatRelativeTime(tomorrow.toISOString())).toBe('明天 10:15')
  })

  it('今年内其它日期（过去或未来，如活动结束时间）显示「MM-DD HH:mm」', () => {
    // 7天后（如活动结束时间 2026-08-22 13:14:38）
    expect(formatRelativeTime('2026-08-22T13:14:38+08:00')).toBe('08-22 13:14')
    // 上个月
    expect(formatRelativeTime('2026-07-10T12:00:00+08:00')).toBe('07-10 12:00')
  })

  it('跨年日期（过去或未来年份）显示「YYYY-MM-DD HH:mm」', () => {
    expect(formatRelativeTime('2025-12-31T23:59:59+08:00')).toBe('2025-12-31 23:59')
    expect(formatRelativeTime('2027-01-01T08:00:00+08:00')).toBe('2027-01-01 08:00')
  })

  it('showTime: false 选项下非今日/昨日/明日不显示时分', () => {
    expect(formatRelativeTime('2026-08-22T13:14:38+08:00', { showTime: false })).toBe('08-22')
    expect(formatRelativeTime('2025-12-31T23:59:59+08:00', { showTime: false })).toBe('2025-12-31')
  })

  it('formatDate 传入自定义格式时按格式输出', () => {
    expect(formatDate('2026-08-15T14:00:00+08:00', 'YYYY/MM/DD')).toBe('2026/08/15')
    expect(formatDate('2026-08-22T13:14:38+08:00', 'YYYY年MM月DD日 HH:mm')).toBe('2026年08月22日 13:14')
  })
})
