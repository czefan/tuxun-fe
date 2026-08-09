/**
 * mock 图片地址与 Media 构造。
 *
 * 用 picsum.photos 的免费测试图，方便直观验证瀑布流、头像、封面的真实观感。
 * 集中在这里而不是散在 db.ts 里，是为了以后换图床/换成本地图只改一处。
 *
 * 注意：这些是**远程**地址，只在 mock 模式下用。生产代码里的兜底头像一律走
 * 本地 /static/images/default-avatar.png，不要把第三方地址写进业务组件。
 */

const BASE = 'https://picsum.photos'

export interface MockMediaObj {
  origin_url?: string
  thumb_url?: string
  width: number
  height: number
}

/**
 * 标章 URL 字段用（契约里 `avatar` 仍是 string）。
 *
 * @param seed picsum 的图片 id，同一 seed 图片稳定
 */
export function mockImageString(seed: number | string, width: number, height: number): string {
  return `${BASE}/seed/${seed}/${width}/${height}`
}

/**
 * 契约 `Media` 结构用。
 * width / height 恒为原图真实像素尺寸。
 */
export function mockMedia(
  seed: number,
  width: number,
  height: number,
  kind: 'thumb' | 'origin' | 'both' = 'both',
): MockMediaObj {
  const origin_url = kind === 'thumb' ? undefined : mockImageString(seed, width, height)
  const thumb_url = kind === 'origin' ? undefined : mockImageString(seed, Math.round(width / 2), Math.round(height / 2))
  const res: MockMediaObj = { width, height }
  if (origin_url) {
    res.origin_url = origin_url
  }
  if (thumb_url) {
    res.thumb_url = thumb_url
  }
  return res
}

const DIVERSE_DIMENSIONS = [
  { width: 1080, height: 1440 }, // 3:4 标准竖图
  { width: 1200, height: 900 }, // 4:3 标准横图
  { width: 1080, height: 1080 }, // 1:1 正方形图
  { width: 1280, height: 720 }, // 16:9 宽屏横图
  { width: 720, height: 1280 }, // 9:16 长手机竖图
  { width: 900, height: 1350 }, // 2:3 单反竖图
  { width: 1350, height: 900 }, // 3:2 单反横图
  { width: 1200, height: 960 }, // 5:4 画框图
  { width: 960, height: 1200 }, // 4:5 社媒竖图
  { width: 1400, height: 600 }, // 21:9 横向全景图
  { width: 600, height: 1200 }, // 1:2 极长竖图
]

/**
 * 根据 seed 稳定生成多种多样且在合理范围（600px~1400px）内的真实比例图片
 */
export function mockDiverseMedia(
  seed: number,
  kind: 'thumb' | 'origin' | 'both' = 'both',
): MockMediaObj {
  const spec = DIVERSE_DIMENSIONS[Math.abs(seed) % DIVERSE_DIMENSIONS.length]
  return mockMedia(seed, spec.width, spec.height, kind)
}

export function toThumbMedia(m: MockMediaObj): MockMediaObj {
  return {
    thumb_url: m.thumb_url ?? m.origin_url,
    width: m.width,
    height: m.height,
  }
}

export function toOriginMedia(m: MockMediaObj): MockMediaObj {
  return {
    origin_url: m.origin_url ?? m.thumb_url,
    width: m.width,
    height: m.height,
  }
}

export function toBothMedia(m: MockMediaObj): MockMediaObj {
  return {
    origin_url: m.origin_url ?? m.thumb_url,
    thumb_url: m.thumb_url ?? m.origin_url,
    width: m.width,
    height: m.height,
  }
}
