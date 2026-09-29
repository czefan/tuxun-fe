/** 草稿和路由回填均按白名单读取，不把外部对象直接合并到响应式表单。 */
export function parseFormDraft(value: unknown) {
  let raw: unknown = value
  if (typeof value === 'string') {
    try {
      raw = JSON.parse(value)
    } catch {
      raw = null
    }
  }
  const data =
    raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {}
  const text = (key: string) => (typeof data[key] === 'string' ? (data[key] as string) : '')
  const latitude =
    typeof data.latitude === 'number' &&
    Number.isFinite(data.latitude) &&
    Math.abs(data.latitude) <= 90
      ? data.latitude
      : 0
  const longitude =
    typeof data.longitude === 'number' &&
    Number.isFinite(data.longitude) &&
    Math.abs(data.longitude) <= 180
      ? data.longitude
      : 0
  return {
    title: text('title'),
    description: text('description'),
    activityId:
      typeof data.activityId === 'number' &&
      Number.isSafeInteger(data.activityId) &&
      data.activityId > 0
        ? data.activityId
        : 0,
    filePath: text('filePath'),
    address: text('address'),
    latitude,
    longitude,
    coordType: data.coordType === 'wgs84' ? ('wgs84' as const) : ('gcj02' as const),
  }
}

/** 临时图片可能已过期；保留文字、坐标，明确要求重新选择图片。 */
export async function restoreDraftImage(filePath: string): Promise<string> {
  if (!filePath) return ''
  return new Promise((resolve) => {
    uni.getImageInfo({
      src: filePath,
      success: () => resolve(filePath),
      fail: () => {
        uni.showToast({ title: '草稿图片已失效，请重新选择图片', icon: 'none' })
        resolve('')
      },
    })
  })
}
