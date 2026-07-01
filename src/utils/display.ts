export function getDisplayedHeat(heat: string, liked: boolean): string {
  if (liked) {
    if (heat.endsWith('万')) {
      return heat
    }
    if (heat.endsWith('k')) {
      const num = Number.parseFloat(heat)
      return `${(num + 0.1).toFixed(1).replace(/\.?0+$/, '')}k`
    }
    const val = Number.parseInt(heat, 10)
    return Number.isFinite(val) ? String(val + 1) : heat
  }
  return heat
}

export interface ImageSize {
  width: number
  height: number
}

export function getScaledRecordImageSize(imageWidth: number, imageHeight: number): ImageSize {
  const maxWidth = 520
  const maxHeight = 360
  const scale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight)

  return {
    width: imageWidth * scale,
    height: imageHeight * scale,
  }
}
