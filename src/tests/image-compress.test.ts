import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  smartCompressImage,
  validateImageAspectRatio,
  validateImageFile,
} from '@/utils/image-compress'

const MB = 1024 * 1024

/** 按路径给出体积；未命中的路径视为取不到大小 */
function stubSizes(sizes: Record<string, number>) {
  ;(uni as any).getFileInfo = vi.fn((options: any) => {
    const size = sizes[options.filePath]
    if (size === undefined) {
      options.fail?.({})
      return
    }
    options.success({ size })
  })
}

/** 模拟 uni.compressImage：产出路径按质量档位区分 */
function stubCompress(sizeByQuality: Record<number, number>, sizes: Record<string, number>) {
  return vi.fn((options: any) => {
    const path = `/tmp/q${options.quality}.jpg`
    sizes[path] = sizeByQuality[options.quality]
    options.success({ tempFilePath: path })
  })
}

describe('按需图片压缩 (smartCompressImage)', () => {
  beforeEach(() => {
    ;(uni as any).compressImage = vi.fn()
    ;(uni as any).getFileInfo = vi.fn()
    ;(uni as any).showLoading = vi.fn()
    ;(uni as any).hideLoading = vi.fn()
    ;(uni as any).showToast = vi.fn()
    ;(uni as any).getImageInfo = vi.fn((opts: any) => opts?.fail?.({ errMsg: 'fail' }))
  })

  it('≤ 2MB 原图直接返回，不做任何降质', async () => {
    stubSizes({ '/tmp/1.5mb.jpg': 1.5 * MB })
    const compress = vi.fn()
    ;(uni as any).compressImage = compress

    await expect(smartCompressImage('/tmp/1.5mb.jpg')).resolves.toBe('/tmp/1.5mb.jpg')
    expect(compress, '未超限却调用了压缩，会无谓降质').not.toHaveBeenCalled()
  })

  it('> 20MB 防爆拦截，抛出异常并提示', async () => {
    stubSizes({ '/tmp/25mb.jpg': 25 * MB })
    const compress = vi.fn()
    ;(uni as any).compressImage = compress

    await expect(smartCompressImage('/tmp/25mb.jpg')).rejects.toThrow('20MB')
    expect(uni.showToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringContaining('20MB') }),
    )
    expect(compress).not.toHaveBeenCalled()
  })

  it('> 2MB 且 ≤ 20MB 时二分查找「能压进 2MB 的最高画质」', async () => {
    const sizes: Record<string, number> = { '/tmp/8mb.jpg': 8 * MB }
    stubSizes(sizes)
    // QUALITY_STEPS = [40, 50, 60, 70, 78, 85, 90, 95]
    // 质量 ≤ 85 能压进 2MB，90 以上压不动
    const sizeByQuality = {
      40: 0.6 * MB,
      50: 0.8 * MB,
      60: 1.1 * MB,
      70: 1.4 * MB,
      78: 1.7 * MB,
      85: 1.9 * MB,
      90: 2.3 * MB,
      95: 3.1 * MB,
    }
    ;(uni as any).compressImage = stubCompress(sizeByQuality, sizes)

    const result = await smartCompressImage('/tmp/8mb.jpg')
    expect(result, '应选中满足体积上限的最高画质档（85）').toBe('/tmp/q85.jpg')
  })

  it('所有档位都压不进 2MB 时，必须返回压得最小的那个，绝不能把超限原图交回去', async () => {
    const sizes: Record<string, number> = { '/tmp/huge.jpg': 18 * MB }
    stubSizes(sizes)
    // 每一档都仍然超过 2MB
    const sizeByQuality = {
      40: 2.5 * MB,
      50: 3.0 * MB,
      60: 4.0 * MB,
      70: 5.5 * MB,
      78: 7.0 * MB,
      85: 9.0 * MB,
      90: 12.0 * MB,
      95: 15.0 * MB,
    }
    ;(uni as any).compressImage = stubCompress(sizeByQuality, sizes)

    const result = await smartCompressImage('/tmp/huge.jpg')
    expect(result, '返回了超限的原图，上传必被后端拒绝').not.toBe('/tmp/huge.jpg')
    expect(result).toBe('/tmp/q40.jpg')
  })

  it('取不到体积时按未知处理，原图直传而不是盲压', async () => {
    stubSizes({})
    const compress = vi.fn()
    ;(uni as any).compressImage = compress

    await expect(smartCompressImage('/tmp/unknown.jpg')).resolves.toBe('/tmp/unknown.jpg')
    expect(compress).not.toHaveBeenCalled()
  })

  it('h5 没有 uni.compressImage 时走 canvas 兜底，且图片加载不了也必须 settle', async () => {
    vi.useFakeTimers()
    try {
      stubSizes({ '/tmp/h5.jpg': 5 * MB })
      delete (uni as any).compressImage

      const pending = smartCompressImage('/tmp/h5.jpg')
      await vi.advanceTimersByTimeAsync(60_000)

      await expect(pending).resolves.toBe('/tmp/h5.jpg')
      expect(uni.hideLoading, 'loading 遮罩没有关掉').toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('图片未超过 2560px 时不得传 compressedWidth / compressedHeight —— 避免不必要缩放', async () => {
    const sizes: Record<string, number> = { '/tmp/4mb.jpg': 4 * MB }
    stubSizes(sizes)
    ;(uni as any).getImageInfo = vi.fn((opts: any) => {
      opts.success?.({ width: 1920, height: 1080 })
    })
    const compress = vi.fn((options: any) => {
      options.success({ tempFilePath: '/tmp/q78.jpg' })
    })
    ;(uni as any).compressImage = compress

    await smartCompressImage('/tmp/4mb.jpg')

    expect(compress).toHaveBeenCalled()
    const firstCallArgs = compress.mock.calls[0][0]
    expect(firstCallArgs.compressedWidth).toBeUndefined()
    expect(firstCallArgs.compressedHeight).toBeUndefined()
  })

  it('单边超过 2560px 时按长边等比收缩至 2560px', async () => {
    const sizes: Record<string, number> = { '/tmp/4mb-huge-dimension.jpg': 4 * MB }
    stubSizes(sizes)
    ;(uni as any).getImageInfo = vi.fn((opts: any) => {
      opts.success?.({ width: 5120, height: 2880 })
    })
    const compress = vi.fn((options: any) => {
      options.success({ tempFilePath: '/tmp/q78.jpg' })
    })
    ;(uni as any).compressImage = compress

    await smartCompressImage('/tmp/4mb-huge-dimension.jpg')

    expect(compress).toHaveBeenCalled()
    const firstCallArgs = compress.mock.calls[0][0]
    expect(firstCallArgs.compressedWidth).toBe(2560)
    expect(firstCallArgs.compressedHeight).toBe(1440)
  })
})

describe('图片宽高比合法性校验 (validateImageAspectRatio)', () => {
  it('正常比例照片（4:3, 16:9, 1:1, 9:16, 9:20）通过校验', async () => {
    ;(uni as any).getImageInfo = vi.fn((opts: any) => {
      opts.success?.({ width: 1080, height: 1920 })
    })
    const res1 = await validateImageAspectRatio('/tmp/normal-vertical.jpg')
    expect(res1.valid).toBe(true)

    ;(uni as any).getImageInfo = vi.fn((opts: any) => {
      opts.success?.({ width: 1920, height: 1080 })
    })
    const res2 = await validateImageAspectRatio('/tmp/normal-horizontal.jpg')
    expect(res2.valid).toBe(true)
  })

  it('极端细长竖图（高度超过宽度 3 倍，例如 1:4）被拦截', async () => {
    ;(uni as any).getImageInfo = vi.fn((opts: any) => {
      opts.success?.({ width: 500, height: 2000 }) // 比例 1:4
    })
    const res = await validateImageAspectRatio('/tmp/long-screenshot.jpg')
    expect(res.valid).toBe(false)
    expect(res.message).toContain('细长')
  })

  it('极端扁平横图（宽度超过高度 3 倍，例如 4:1）被拦截', async () => {
    ;(uni as any).getImageInfo = vi.fn((opts: any) => {
      opts.success?.({ width: 3200, height: 800 }) // 比例 4:1
    })
    const res = await validateImageAspectRatio('/tmp/wide-banner.jpg')
    expect(res.valid).toBe(false)
    expect(res.message).toContain('扁平')
  })

  it('无法获取图片尺寸时安全放行', async () => {
    ;(uni as any).getImageInfo = vi.fn((opts: any) => {
      opts.fail?.({ errMsg: 'fail' })
    })
    const res = await validateImageAspectRatio('/tmp/corrupted.jpg')
    expect(res.valid).toBe(true)
  })
})

describe('图片综合校验 (validateImageFile)', () => {
  it('> 20MB 直接拦截并报错', async () => {
    stubSizes({ '/tmp/huge-25mb.jpg': 25 * MB })
    const res = await validateImageFile('/tmp/huge-25mb.jpg')
    expect(res.valid).toBe(false)
    expect(res.message).toContain('20MB')
  })

  it('支持自定义 maxSizeBytes 并在超限时正确提示', async () => {
    stubSizes({ '/tmp/6mb.jpg': 6 * MB })
    const res = await validateImageFile('/tmp/6mb.jpg', { maxSizeBytes: 5 * MB })
    expect(res.valid).toBe(false)
    expect(res.message).toContain('5MB')
  })

  it('合规图片且比例正常时校验通过', async () => {
    stubSizes({ '/tmp/valid.jpg': 3 * MB })
    ;(uni as any).getImageInfo = vi.fn((opts: any) => {
      opts.success?.({ width: 1920, height: 1080 })
    })
    const res = await validateImageFile('/tmp/valid.jpg')
    expect(res.valid).toBe(true)
    expect(res.size).toBe(3 * MB)
    expect(res.width).toBe(1920)
    expect(res.height).toBe(1080)
  })
})
