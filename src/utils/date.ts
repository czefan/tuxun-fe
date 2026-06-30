/**
 * 格式化时间。
 */
export function formatTime(dateStr: string, format = 'YYYY-MM-DD HH:mm'): string {
  const d = new Date(dateStr)
  const map: Record<string, string> = {
    YYYY: String(d.getFullYear()),
    MM: String(d.getMonth() + 1).padStart(2, '0'),
    DD: String(d.getDate()).padStart(2, '0'),
    HH: String(d.getHours()).padStart(2, '0'),
    mm: String(d.getMinutes()).padStart(2, '0'),
    ss: String(d.getSeconds()).padStart(2, '0'),
  }

  let result = format
  for (const [key, value] of Object.entries(map)) {
    result = result.replace(key, value)
  }
  return result
}
