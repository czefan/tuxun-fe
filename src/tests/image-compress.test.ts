import { beforeEach, describe, expect, it, vi } from 'vitest'
import { smartCompressImage, validateImageAspectRatio } from '@/utils/image-compress'

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

describe('按需图片压缩', () => {
  beforeEach(() => {
    ;(uni as any).compressImage = vi.fn()
    ;(uni as any).getFileInfo = vi.fn()
    ;(uni as any).showLoading = vi.fn()
    ;(uni as any).hideLoading = vi.fn()
    ;(uni as any).getImageInfo = vi.fn((opts: any) => opts?.fail?.({ errMsg: 'fail' }))
  })

  it('≤ 10MB 原图直接返回，不做任何降质', async () => {
    stubSizes({ '/tmp/8mb.jpg': 8 * MB })
    const compress = vi.fn()
    ;(uni as any).compressImage = compress

    await expect(smartCompressImage('/tmp/8mb.jpg')).resolves.toBe('/tmp/8mb.jpg')
    expect(compress, '未超限却调用了压缩，会无谓降质').not.toHaveBeenCalled()
  })

  it('> 10MB 时取「能压进 9.5MB 的最高画质」，而不是压到最狠', async () => {
    const sizes: Record<string, number> = { '/tmp/15mb.jpg': 15 * MB }
    stubSizes(sizes)
    // 质量 ≤ 60 能压进 9.5MB，70 以上压不动
    const sizeByQuality = {
      10: 2 * MB,
      20: 4 * MB,
      30: 5 * MB,
      40: 6.5 * MB,
      50: 8 * MB,
      60: 9.2 * MB,
      70: 10.5 * MB,
      80: 12 * MB,
      90: 13.5 * MB,
    }
    ;(uni as any).compressImage = stubCompress(sizeByQuality, sizes)

    const result = await smartCompressImage('/tmp/15mb.jpg')
    expect(result, '应选中满足体积上限的最高画质档（60）').toBe('/tmp/q60.jpg')
  })

  it('所有档位都压不进目标时，必须返回压得最小的那个，绝不能把超限原图交回去', async () => {
    const sizes: Record<string, number> = { '/tmp/huge.jpg': 400 * MB }
    stubSizes(sizes)
    // 每一档都仍然超过 9.5MB
    const sizeByQuality = {
      10: 10 * MB,
      20: 12 * MB,
      30: 15 * MB,
      40: 20 * MB,
      50: 30 * MB,
      60: 45 * MB,
      70: 60 * MB,
      80: 80 * MB,
      90: 120 * MB,
    }
    ;(uni as any).compressImage = stubCompress(sizeByQuality, sizes)

    const result = await smartCompressImage('/tmp/huge.jpg')
    expect(result, '返回了超限的原图，上传必被后端拒绝').not.toBe('/tmp/huge.jpg')
    expect(result).toBe('/tmp/q10.jpg')
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
      stubSizes({ '/tmp/h5.jpg': 15 * MB })
      delete (uni as any).compressImage

      const pending = smartCompressImage('/tmp/h5.jpg')
      // jsdom 不会加载图片，onload / onerror 都不触发；
      // 没有超时兜底的话这里会永远挂住，调用方停在 loading 遮罩上
      await vi.advanceTimersByTimeAsync(60_000)

      await expect(pending).resolves.toBe('/tmp/h5.jpg')
      expect(uni.hideLoading, 'loading 遮罩没有关掉').toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('图片未超过 4096px 时不得传 compressedWidth / compressedHeight —— 否则会被放大', async () => {
    const sizes: Record<string, number> = { '/tmp/15mb.jpg': 15 * MB }
    stubSizes(sizes)
    ;(uni as any).getImageInfo = vi.fn((opts: any) => {
      opts.success?.({ width: 2000, height: 3000 })
    })
    const compress = vi.fn((options: any) => {
      options.success({ tempFilePath: '/tmp/q50.jpg' })
    })
    ;(uni as any).compressImage = compress

    await smartCompressImage('/tmp/15mb.jpg')

    expect(compress).toHaveBeenCalled()
    const firstCallArgs = compress.mock.calls[0][0]
    expect(firstCallArgs.compressedWidth).toBeUndefined()
    expect(firstCallArgs.compressedHeight).toBeUndefined()
  })

  it('超长边按长边等比收缩，且宽高同时下传', async () => {
    const sizes: Record<string, number> = { '/tmp/15mb-huge-dimension.jpg': 15 * MB }
    stubSizes(sizes)
    ;(uni as any).getImageInfo = vi.fn((opts: any) => {
      opts.success?.({ width: 6000, height: 4000 })
    })
    const compress = vi.fn((options: any) => {
      options.success({ tempFilePath: '/tmp/q50.jpg' })
    })
    ;(uni as any).compressImage = compress

    await smartCompressImage('/tmp/15mb-huge-dimension.jpg')

    expect(compress).toHaveBeenCalled()
    const firstCallArgs = compress.mock.calls[0][0]
    expect(firstCallArgs.compressedWidth).toBe(4096)
    expect(firstCallArgs.compressedHeight).toBe(2731)
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

  it('极端细长竖图（高度超过宽度 3.5 倍）被拦截', async () => {
    ;(uni as any).getImageInfo = vi.fn((opts: any) => {
      opts.success?.({ width: 500, height: 2500 }) // 比例 1:5
    })
    const res = await validateImageAspectRatio('/tmp/long-screenshot.jpg')
    expect(res.valid).toBe(false)
    expect(res.message).toContain('细长')
  })

  it('极端扁平横图（宽度超过高度 3.5 倍）被拦截', async () => {
    ;(uni as any).getImageInfo = vi.fn((opts: any) => {
      opts.success?.({ width: 3600, height: 800 }) // 比例 4.5:1
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
