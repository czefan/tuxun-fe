import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_COORD_TYPE, isSubmittableLocation, locate, normalizeToGcj02 } from '@/composables/use-map'

function read(relative: string) {
  return fs.readFileSync(path.join(process.cwd(), relative), 'utf-8')
}

/** 三个会把坐标交出去的入口：投稿、作答、手填 */
const SUBMIT_SITES = [
  'src/subPages/contribute/index.vue',
  'src/subPages/question/submit.vue',
  'src/components/form-location-picker/form-location-picker.vue',
]

describe('坐标提交守卫', () => {
  afterEach(() => {
    // stubGlobal 会顶掉 test-setup 里的 uni mock，不还原会污染后续用例
    vi.unstubAllGlobals()
  })

  it('坐标系恒为 gcj02', () => {
    expect(DEFAULT_COORD_TYPE).toBe('gcj02')
  })

  it('locate() 必须显式要 gcj02（uni.getLocation 默认给的是 wgs84）', async () => {
    const getLocation = vi.fn((options: any) => options.success?.({ latitude: 30.1, longitude: 120.2 }))
    vi.stubGlobal('uni', { getLocation })

    await expect(locate()).resolves.toEqual({ latitude: 30.1, longitude: 120.2 })
    expect(getLocation).toHaveBeenCalledWith(expect.objectContaining({ type: 'gcj02' }))
  })

  it('locate() 失败时返回 null 而不是抛错', async () => {
    vi.stubGlobal('uni', { getLocation: (o: any) => o.fail?.({ errMsg: 'denied' }) })
    await expect(locate()).resolves.toBeNull()
  })

  it('isSubmittableLocation 拦住未选点和越界坐标', () => {
    // 未选点：两个页面都用 0/0 表示初始态
    expect(isSubmittableLocation(0, 0)).toBe(false)
    // 越界——契约规定纬度 ±90、经度 ±180，越界后端返回 400 / code=5
    expect(isSubmittableLocation(91, 120)).toBe(false)
    expect(isSubmittableLocation(30, 181)).toBe(false)
    expect(isSubmittableLocation(Number.NaN, 120)).toBe(false)
    // 边界值和常规值必须放行
    expect(isSubmittableLocation(90, 180)).toBe(true)
    expect(isSubmittableLocation(-90, -180)).toBe(true)
    expect(isSubmittableLocation(30.123456, 120.456789)).toBe(true)
    // 单轴为 0 是合法的（赤道 / 本初子午线），不能一刀切成「未选点」
    expect(isSubmittableLocation(0, 120.456)).toBe(true)
  })

  it('三个入口都必须走同一个校验，不能各写各的', () => {
    for (const file of SUBMIT_SITES) {
      expect(
        read(file),
        `${file} 没有调用 isSubmittableLocation：校验散落各处迟早不一致，越界坐标会直接打到后端`,
      ).toContain('isSubmittableLocation(')
    }
  })

  it('坐标校验必须挡在提交路径上，不能只是被「提到」', () => {
    // 上一版这条守卫只查源码里有没有出现 isSubmittableLocation(，
    // 结果校验被挪进 wd-form 的 rules（那个 prop 根本不存在、永不执行）之后，
    // 字符串还在、守卫全绿，而空表单可以直接提交。
    // 现在要求它出现在 handleSubmit 内部，且后面跟着一条提前 return。
    for (const file of ['src/subPages/contribute/index.vue', 'src/subPages/question/submit.vue']) {
      const source = read(file)
      const submitFn = source.match(/(?:async )?function handleSubmit\(\)[\s\S]*?\n\}/)?.[0] ?? ''

      expect(
        submitFn.includes('isSubmittableLocation('),
        `${file}: handleSubmit 里没有坐标校验——校验写在别处等于没写`,
      ).toBe(true)

      const gate = submitFn.match(/if \(!isSubmittableLocation\([^)]*\)\)[\s\S]{0,160}?return/)
      expect(
        gate !== null,
        `${file}: 坐标校验没有拦截提交（缺少 if (!isSubmittableLocation(...)) { ... return }）`,
      ).toBe(true)
    }
  })

  it('提交表单不得依赖 wd-form 的 rules —— 这个版本的 wd-form 没有该 prop', () => {
    // wd-form 只认 schema（{ validate(model) => Issue[] }，配 zod 适配器），
    // 传 :rules 会被当普通属性丢掉，validate() 恒返回 valid: true。
    for (const file of ['src/subPages/contribute/index.vue', 'src/subPages/question/submit.vue', 'src/subPages/my/feedback.vue']) {
      expect(
        read(file).includes(':rules='),
        `${file} 给 wd-form 传了 :rules，但这个版本没有该 prop，校验会静默失效`,
      ).toBe(false)
    }
  })

  it('提交页不得再出现硬编码坐标', () => {
    for (const file of ['src/subPages/contribute/index.vue', 'src/subPages/question/submit.vue']) {
      const source = read(file)
      const hint = `${file} 又出现了硬编码坐标：用户不选点也会提交一个假位置`
      expect(source, hint).not.toContain('30.123')
      expect(source, hint).not.toContain('120.456')
    }
  })

  it('wgs84 → gcj02 转换必须精确到米级', () => {
    // 杭州西湖基准点。用具体期望值而不是 toBeGreaterThan：
    // 后者对恒等函数同样成立（输入 30.2448 本来就 > 30.24），等于什么都没测。
    const { latitude, longitude } = normalizeToGcj02(30.2448, 120.1512, 'wgs84')
    expect(latitude).toBeCloseTo(30.242476, 5)
    expect(longitude).toBeCloseTo(120.155903, 5)

    // 显式钉住「必须真的发生偏移」，防止转换被改成直通
    expect(Math.abs(latitude - 30.2448)).toBeGreaterThan(0.001)
    expect(Math.abs(longitude - 120.1512)).toBeGreaterThan(0.001)
  })

  it('bd09 → gcj02 转换必须精确到米级', () => {
    const { latitude, longitude } = normalizeToGcj02(30.25, 120.158, 'bd09')
    expect(latitude).toBeCloseTo(30.244027, 5)
    expect(longitude).toBeCloseTo(120.151489, 5)
  })

  it('已经是 gcj02 或在国境外时不得二次偏移', () => {
    // 后端已给 gcj02：原样返回
    expect(normalizeToGcj02(30.2448, 120.1512, 'gcj02')).toEqual({
      latitude: 30.2448,
      longitude: 120.1512,
    })
    // 缺省坐标系按 gcj02 处理，同样不转换
    expect(normalizeToGcj02(30.2448, 120.1512, undefined)).toEqual({
      latitude: 30.2448,
      longitude: 120.1512,
    })
    // 国境外 GCJ-02 不适用，wgs84 也必须原样返回（东京）
    expect(normalizeToGcj02(35.6812, 139.7671, 'wgs84')).toEqual({
      latitude: 35.6812,
      longitude: 139.7671,
    })
  })
})
