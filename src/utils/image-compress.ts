/**
 * 按需图片压缩与合法性校验。
 *
 * 策略：
 * 1. > 20MB 防爆拦截，避免移动端/H5 解码超大图导致 OOM 崩溃；
 * 2. ≤ 2MB 直接上传，0 耗时 0 损耗保留原图最高画质；
 * 3. > 2MB 触发智能压缩：长边约束至 2.5K (2560px)，并在高质量档位二分查找「≤ 2MB 以内的最高画质」；
 * 4. 宽高比限制在 1:3 ~ 3:1 之间，拦截极端畸形长截图/全景横幅。
 *
 * 平台差异：`uni.compressImage` 在 H5 运行时里未实现，走 canvas 重编码兜底。
 */

const MAX_INPUT_FILE_SIZE = 20 * 1024 * 1024 // 20MB 硬上限防爆拦截
const MAX_DIRECT_UPLOAD_SIZE = 2 * 1024 * 1024 // 2MB 原图直传阈值
const TARGET_COMPRESSED_SIZE = 2 * 1024 * 1024 // 2MB 压缩目标体积
const MAX_DIMENSION = 2560 // 2.5K 分辨率上限

/** 质量档位，从低到高。二分查找 ≤ 2MB 的最高画质档位 */
const QUALITY_STEPS = [40, 50, 60, 70, 78, 85, 90, 95]

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

async function compressWithQuality(
  filePath: string,
  quality: number,
  size?: { width: number; height: number },
): Promise<string> {
  if (!canUseUniCompress()) {
    return compressByCanvas(filePath, quality)
  }

  // 尺寸在整个二分过程中不变，优先使用调用方预先测量好的 size，避免每轮都重复 getImageSize 解码
  const { width, height } = size ?? (await getImageSize(filePath))
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
 * 按需智能压缩图片，寻找 ≤ 2MB 的最高画质
 * @param filePath 待上传的本地图片路径
 * @returns 可直接上传的图片路径
 */
export async function smartCompressImage(filePath: string): Promise<string> {
  if (!filePath) {
    return filePath
  }

  const size = await getFileSize(filePath)

  // > 20MB 防爆拦截
  if (size > MAX_INPUT_FILE_SIZE) {
    uni.showToast({ title: '图片大小不能超过 20MB', icon: 'none' })
    throw new Error('图片大小超过 20MB 限制')
  }

  // 体积未知或本来就不超限（≤ 2MB），一律原图直传
  if (size === 0 || size <= MAX_DIRECT_UPLOAD_SIZE) {
    return filePath
  }

  uni.showLoading({ title: '正在优化图片…', mask: true })
  try {
    const sourceSize = await getImageSize(filePath)
    let low = 0
    let high = QUALITY_STEPS.length - 1
    let bestPath = ''
    // 兜底：所有档位都压不进目标时，用压得最小的那个，绝不能把超限的原图交回去
    let smallestPath = ''
    let smallestSize = Number.POSITIVE_INFINITY

    while (low <= high) {
      const mid = Math.floor((low + high) / 2)
      const candidate = await compressWithQuality(filePath, QUALITY_STEPS[mid], sourceSize)
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
 * @param minRatio 最小宽高比（默认 1 / 3 ≈ 0.333，即高度最多为宽度的 3 倍）
 * @param maxRatio 最大宽高比（默认 3.0，即宽度最多为高度的 3 倍）
 */
export async function validateImageAspectRatio(
  filePath: string,
  minRatio = 1 / 3,
  maxRatio = 3,
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

/**
 * 综合校验图片合法性（体积防爆 + 宽高比）
 */
export async function validateImageFile(
  filePath: string,
  options?: {
    maxSizeBytes?: number
    minRatio?: number
    maxRatio?: number
  },
): Promise<{ valid: boolean; width?: number; height?: number; size?: number; message?: string }> {
  if (!filePath) {
    return { valid: true }
  }

  const maxSizeBytes = options?.maxSizeBytes ?? MAX_INPUT_FILE_SIZE
  const minRatio = options?.minRatio ?? 1 / 3
  const maxRatio = options?.maxRatio ?? 3

  const size = await getFileSize(filePath)
  if (size > 0 && size > maxSizeBytes) {
    const limitMB = Math.round(maxSizeBytes / (1024 * 1024))
    return {
      valid: false,
      size,
      message: `图片大小不能超过 ${limitMB}MB`,
    }
  }

  const ratioCheck = await validateImageAspectRatio(filePath, minRatio, maxRatio)
  if (!ratioCheck.valid) {
    return {
      ...ratioCheck,
      size,
    }
  }

  return {
    valid: true,
    size,
    width: ratioCheck.width,
    height: ratioCheck.height,
  }
}
