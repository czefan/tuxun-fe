/**
 * 数值紧凑格式化（设计规范：万 / 亿 分级）
 *
 * | 原始数值 | 展示格式 |
 * | --- | --- |
 * | 0 ≤ n ≤ 9999 | 完整数字，无单位 |
 * | 1万 ≤ n ≤ 9.9999万 | ÷10000 保留 1 位小数，.0 省略，后缀「万」 |
 * | ≥10万 | ÷10000 四舍五入取整数，后缀「万」 |
 * | ≥1亿 | 继承万级规则：1亿～9.9999亿 保留 1 位小数，≥10亿 只取整数，后缀「亿」 |
 *
 * 点赞数、评论数、已破解数等计数类数值统一按此规范展示。
 */
export function formatCompactCount(count: number | string | null | undefined): string {
  const n = Number(count)
  if (!Number.isFinite(n) || n <= 0) {
    return '0'
  }

  // ≥1亿：先换算成「亿」，再套用万级的同一套分档规则
  if (n >= 100_000_000) {
    const yi = n / 100_000_000
    if (yi >= 10) {
      return `${Math.round(yi)}亿`
    }
    return `${trimDecimal(Math.round(yi * 10) / 10)}亿`
  }

  // ≥10万：÷10000 四舍五入取整数（99500 → 10万，126400 → 13万）
  if (n >= 100_000) {
    return `${Math.round(n / 10_000)}万`
  }

  // ≥1万：÷10000 保留 1 位小数，.0 省略（12499 → 1.2万，12500 → 1.3万）
  if (n >= 10_000) {
    return `${trimDecimal(Math.round((n / 10_000) * 10) / 10)}万`
  }

  return String(n)
}

/** 四舍五入到 1 位小数后，若小数为 .0 则省略小数点 */
function trimDecimal(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}
