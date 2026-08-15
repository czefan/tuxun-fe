import dayjs from 'dayjs'

export interface FormatRelativeTimeOptions {
  /** 是否在今年非今日或往年日期后附带时间 HH:mm (默认 true；今天/昨天固定附带时分，1小时内固定为刚刚/X分钟前) */
  showTime?: boolean
}

/**
 * 主流人性化时间转换方案（过去与未来对称）：
 *
 * 过去时间：
 * 1. 1 分钟内：显示 “刚刚”
 * 2. 1 小时内：显示 “X分钟前”（如：5分钟前）
 * 3. 今天（超过1小时）：显示 “今天 HH:mm”（如：今天 14:30）
 * 4. 昨天：显示 “昨天 HH:mm”（如：昨天 09:15）
 * 5. 今年（非今天/昨天）：显示 “MM-DD HH:mm” 或 “MM-DD”
 * 6. 往年（跨年）：显示年份 “YYYY-MM-DD HH:mm” 或 “YYYY-MM-DD”
 *
 * 未来时间：
 * 1. 1 分钟内：显示 “即将开始”
 * 2. 1 小时内：显示 “X分钟后”（如：5分钟后）
 * 3. 今天（超过1小时）：显示 “今天 HH:mm”（如：今天 20:30）
 * 4. 明天：显示 “明天 HH:mm”（如：明天 09:15）
 * 5. 今年（非今天/明天）：显示 “MM-DD HH:mm” 或 “MM-DD”
 * 6. 跨年未来：显示年份 “YYYY-MM-DD HH:mm” 或 “YYYY-MM-DD”
 */
export function formatRelativeTime(
  dateInput?: string | Date | number | null,
  options: FormatRelativeTimeOptions = {},
): string {
  const { showTime = true } = options
  if (!dateInput) {
    return ''
  }

  const d = dayjs(dateInput)
  if (!d.isValid()) {
    return String(dateInput)
  }

  // 防御：当传入缺年份的字符串（如 "07-01 12:00"）时，部分 JS 引擎默认会补为 2001 年，
  // 若原始输入不包含 '2001'，直接原样输出，避免错误显示成 2001 年。
  if (typeof dateInput === 'string' && d.year() === 2001 && !dateInput.includes('2001')) {
    return dateInput
  }

  const now = dayjs()
  const diffSeconds = now.diff(d, 'second')

  // 未来时间 (diffSeconds < 0)
  if (diffSeconds < 0) {
    const futureSeconds = -diffSeconds

    // 1 分钟以内
    if (futureSeconds < 60) {
      return '即将开始'
    }

    // 1 小时以内
    if (futureSeconds < 3600) {
      const minutes = Math.floor(futureSeconds / 60)
      return `${minutes}分钟后`
    }

    // 今天稍晚
    if (d.isSame(now, 'day')) {
      return `今天 ${d.format('HH:mm')}`
    }

    // 明天
    const tomorrow = now.add(1, 'day')
    if (d.isSame(tomorrow, 'day')) {
      return `明天 ${d.format('HH:mm')}`
    }

    // 今年未来
    if (d.isSame(now, 'year')) {
      return showTime ? d.format('MM-DD HH:mm') : d.format('MM-DD')
    }

    // 跨年未来
    return showTime ? d.format('YYYY-MM-DD HH:mm') : d.format('YYYY-MM-DD')
  }

  // 过去时间 (diffSeconds >= 0)
  // 1 分钟以内
  if (diffSeconds < 60) {
    return '刚刚'
  }

  // 1 小时以内
  if (diffSeconds < 3600) {
    const minutes = Math.floor(diffSeconds / 60)
    return `${minutes}分钟前`
  }

  // 今天更早
  if (d.isSame(now, 'day')) {
    return `今天 ${d.format('HH:mm')}`
  }

  // 昨天
  const yesterday = now.subtract(1, 'day')
  if (d.isSame(yesterday, 'day')) {
    return `昨天 ${d.format('HH:mm')}`
  }

  // 今年 (非今天/昨天)
  if (d.isSame(now, 'year')) {
    return showTime ? d.format('MM-DD HH:mm') : d.format('MM-DD')
  }

  // 往年 (跨年)
  return showTime ? d.format('YYYY-MM-DD HH:mm') : d.format('YYYY-MM-DD')
}

/**
 * 兼容原有 formatDate API：
 * - 不传 format 时，默认使用主流人性化时间显示
 * - 传 format 字符串时（如 'YYYY-MM-DD'），显式使用 dayjs 格式输出
 */
export function formatDate(
  dateInput?: string | Date | number | null,
  format?: string,
): string {
  if (!dateInput) {
    return ''
  }

  const d = dayjs(dateInput)
  if (!d.isValid()) {
    return String(dateInput)
  }

  if (format) {
    if (typeof dateInput === 'string' && d.year() === 2001 && !dateInput.includes('2001')) {
      return dateInput
    }
    return d.format(format)
  }

  return formatRelativeTime(dateInput)
}
