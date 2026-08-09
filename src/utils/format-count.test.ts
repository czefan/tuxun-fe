import { describe, expect, it } from 'vitest'
import { formatCompactCount } from './format-count'

describe('formatCompactCount 计数万/亿分级格式化', () => {
  it('0–9999：完整阿拉伯数字，无单位', () => {
    expect(formatCompactCount(0)).toBe('0')
    expect(formatCompactCount(999)).toBe('999')
    expect(formatCompactCount(5612)).toBe('5612')
    expect(formatCompactCount(9999)).toBe('9999')
  })

  it('1万–9.9999万：÷10000 保留 1 位小数，.0 省略，后缀「万」', () => {
    expect(formatCompactCount(10_000)).toBe('1万')
    expect(formatCompactCount(12_499)).toBe('1.2万')
    expect(formatCompactCount(12_500)).toBe('1.3万')
    expect(formatCompactCount(99_499)).toBe('9.9万')
  })

  it('≥10万：÷10000 四舍五入取整数，后缀「万」', () => {
    expect(formatCompactCount(99_500)).toBe('10万')
    expect(formatCompactCount(126_400)).toBe('13万')
    expect(formatCompactCount(999_500)).toBe('100万')
  })

  it('≥1亿：继承万级规则——1亿～9.9999亿 留 1 位小数，≥10亿 只取整数，后缀「亿」', () => {
    expect(formatCompactCount(100_000_000)).toBe('1亿')
    expect(formatCompactCount(120_000_000)).toBe('1.2亿')
    expect(formatCompactCount(1_000_000_000)).toBe('10亿')
  })

  it('越界整数自动进位', () => {
    expect(formatCompactCount(99_949_999)).toBe('9995万')
    expect(formatCompactCount(999_999_999)).toBe('10亿')
  })

  it('非法/空值回落为 0', () => {
    expect(formatCompactCount(null)).toBe('0')
    expect(formatCompactCount(undefined)).toBe('0')
    expect(formatCompactCount('abc')).toBe('0')
    expect(formatCompactCount(-5)).toBe('0')
  })
})
