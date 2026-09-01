/**
 * 按需图片压缩。
 *
 * 策略：
 * 1. ≤ 10MB 直接上传，绝不无谓降质；
 * 2. > 10MB 才在质量档位上二分，取「能压到 9.5MB 以内的最高画质」；
 * 3. 超高像素大图（单边 > 4096px）自动等比缩放，彻底消除极端超大图无法压进 10MB 的风险。
 *
 * 平台差异：`uni.compressImage` 在 H5 运行时里根本不存在
 * （@dcloudio/uni-h5 未实现），直接调用会抛 TypeError 并让调用方的
 * await 静默失败。所以 H5 走 canvas 重编码兜底。
 */

const MAX_DIRECT_UPLOAD_SIZE = 10 * 1024 * 1024
const TARGET_COMPRESSED_SIZE = 9.5 * 1024 * 1024
const MAX_DIMENSION = 4096

/** 质量档位，从低到高。用离散档位而非 1~100 连续区间，二分最多 4 轮，避免大图上反复重编码 */
const QUALITY_STEPS = [10, 20, 30, 40, 50, 60, 70, 80, 90]

/** canvas 兜底的超时保护，单位毫秒 */
const CANVAS_COMPRESS_TIMEOUT = 10_000

function canUseUniCompress() {
  return typeof (uni as any).compressImage === 'function'
}

/** H5 下用 canvas 重编码；其余平台没有 document，直接返回原图 */
function compressByCanvas(src: string, quality: number): Promise<string> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined' || typeof Image === 'undefined') {
      resolve(src)
      return
    }

    // 图片加载失败在部分环境下既不触发 onload 也不触发 onerror，
    // 没有兜底的话 Promise 永不 settle，调用方会一直卡在 loading 遮罩里
    let settled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const settle = (value: string) => {
      if (settled) {
        return
      }
      settled = true
      clearTimeout(timer)
      resolve(value)
    }
    timer = setTimeout(settle, CANVAS_COMPRESS_TIMEOUT, src)

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      let { naturalWidth: width, naturalHeight: height } = img
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        settle(src)
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => settle(blob ? URL.createObjectURL(blob) : src),
        'image/jpeg',
        quality / 100,
      )
    }
    img.onerror = () => settle(src)
    img.src = src
  })
}

/** 取不到大小时返回 0，调用方按「未知」处理（不压缩） */
function getFileSize(filePath: string): Promise<number> {
  return new Promise((resolve) => {
    if (typeof (uni as any).getFileInfo === 'function') {
      uni.getFileInfo({
        filePath,
        success: (res) => resolve(res.size),
        fail: () => resolve(0),
      })
      return
    }

    // H5 上 blob:/data: 路径可以直接量出体积
    if (typeof fetch === 'function' && /^(?:blob:|data:)/.test(filePath)) {
      fetch(filePath)
        .then((res) => res.blob())
        .then((blob) => resolve(blob.size))
        .catch(() => resolve(0))
      return
    }

    resolve(0)
  })
}

function getImageSize(filePath: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    if (typeof (uni as any).getImageInfo === 'function') {
      uni.getImageInfo({
        src: filePath,
        success: (info: any) => {
          resolve({
            width: Number(info?.width) || 0,
            height: Number(info?.height) || 0,
          })
        },
        fail: () => resolve({ width: 0, height: 0 }),
      })
      return
    }
    resolve({ width: 0, height: 0 })
  })
}

async function compressWithQuality(filePath: string, quality: number): Promise<string> {
  if (!canUseUniCompress()) {
    return compressByCanvas(filePath, quality)
  }

  // compressedWidth 是「压缩后的宽度」而非上限，无条件传会把小图放大 —— 必须先量尺寸
  const { width, height } = await getImageSize(filePath)
  const needsResize = width > MAX_DIMENSION || height > MAX_DIMENSION
  const ratio = needsResize ? Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height) : 1

  return new Promise((resolve) => {
    uni.compressImage({
      src: filePath,
      quality,
      // 与 canvas 分支保持同一套「按长边等比收缩」语义；取不到尺寸时不传，退回纯质量压缩
      ...(needsResize && width
        ? {
            compressedWidth: Math.round(width * ratio),
            compressedHeight: Math.round(height * ratio),
          }
        : {}),
      success: (res) => resolve(res.tempFilePath || filePath),
      fail: () => resolve(filePath),
    })
  })
}

/**
 * @param filePath 待上传的本地图片路径
 * @returns 可直接上传的图片路径
 */
export async function smartCompressImage(filePath: string): Promise<string> {
  if (!filePath) {
    return filePath
  }

  const size = await getFileSize(filePath)

  // 体积未知或本来就不超限，一律原图直传
  if (size === 0 || size <= MAX_DIRECT_UPLOAD_SIZE) {
    return filePath
  }

  uni.showLoading({ title: '正在压缩图片…', mask: true })
  try {
    let low = 0
    let high = QUALITY_STEPS.length - 1
    let bestPath = ''
    // 兜底：所有档位都压不进目标时，用压得最小的那个，
    // 绝不能把超限的原图交回去——那必然被后端拒绝
    let smallestPath = ''
    let smallestSize = Number.POSITIVE_INFINITY

    while (low <= high) {
      const mid = Math.floor((low + high) / 2)
      const candidate = await compressWithQuality(filePath, QUALITY_STEPS[mid])
      const candidateSize = await getFileSize(candidate)

      if (candidateSize > 0 && candidateSize < smallestSize) {
        smallestSize = candidateSize
        smallestPath = candidate
      }

      if (candidateSize > 0 && candidateSize <= TARGET_COMPRESSED_SIZE) {
        bestPath = candidate
        low = mid + 1 // 还有余量，试更高画质
      } else {
        high = mid - 1 // 太大，降档
      }
    }

    return bestPath || smallestPath || filePath
  } finally {
    uni.hideLoading()
  }
}

/**
 * 校验图片宽高比是否在合理范围内（防极端畸形长截图/长条横幅）
 * @param filePath 本地图片路径
 * @param minRatio 最小宽高比（默认 1 / 3.5 ≈ 0.285，即高度最多为宽度的 3.5 倍）
 * @param maxRatio 最大宽高比（默认 3.5，即宽度最多为高度的 3.5 倍）
 */
export async function validateImageAspectRatio(
  filePath: string,
  minRatio = 0.285,
  maxRatio = 3.5,
): Promise<{ valid: boolean; width?: number; height?: number; message?: string }> {
  if (!filePath) {
    return { valid: true }
  }

  const { width, height } = await getImageSize(filePath)
  if (!width || !height) {
    return { valid: true }
  }

  const ratio = width / height
  if (ratio < minRatio) {
    return {
      valid: false,
      width,
      height,
      message: '图片比例过于细长，请选择标准比例照片',
    }
  }
  if (ratio > maxRatio) {
    return {
      valid: false,
      width,
      height,
      message: '图片比例过于扁平，请选择标准比例照片',
    }
  }

  return { valid: true, width, height }
}
