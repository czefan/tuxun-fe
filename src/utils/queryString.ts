export type QueryValue = unknown
export type QueryParams = Record<string, QueryValue | QueryValue[]>

export function stringifyQuery(obj: QueryParams): string {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return ''
  }

  return Object.entries(obj)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      const encodedKey = encodeURIComponent(key)

      if (Array.isArray(value)) {
        return value
          .filter(item => item !== undefined && item !== null)
          .map(item => `${encodedKey}=${encodeURIComponent(String(item))}`)
          .join('&')
      }

      return `${encodedKey}=${encodeURIComponent(String(value))}`
    })
    .join('&')
}
