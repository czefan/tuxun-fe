import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import FormLocationPicker from './form-location-picker.vue'

/**
 * 选点同步链路守卫。
 *
 * 回归场景：卡片内选点 → 全屏（chooseLocation）初始位置 = 卡片草稿；
 * 全屏改选 → 回卡片地图中心与父组件表单必须同步。
 * 任一入口（全屏 / tap / 拖动结束）落点后都必须 emit update:* 到父组件，
 * 否则提交时用的是旧坐标。
 */

let mapCtx: {
  moveToLocation: ReturnType<typeof vi.fn>
  pixelToCoordinate: ReturnType<typeof vi.fn>
  getCenterLocation: ReturnType<typeof vi.fn>
}

function makeMapCtx() {
  return {
    moveToLocation: vi.fn(),
    pixelToCoordinate: vi.fn(),
    getCenterLocation: vi.fn(),
  }
}

beforeEach(() => {
  mapCtx = makeMapCtx()
  if (!('createMapContext' in uni)) {
    // test-setup 的 uniMock 没有地图 API，测试内补充
    ;(uni as any).createMapContext = vi.fn()
  }
  if (!('chooseLocation' in uni)) {
    ;(uni as any).chooseLocation = vi.fn()
  }
  if (!('getLocation' in uni)) {
    ;(uni as any).getLocation = vi.fn()
  }
  vi.mocked(uni.createMapContext).mockReturnValue(mapCtx as any)
  vi.mocked(uni.chooseLocation).mockClear()
  vi.mocked(uni.showToast).mockClear()
  vi.mocked(uni.getLocation).mockReset()
})

afterEach(() => {
  vi.useRealTimers()
})

function mountPicker(initial = { latitude: 0, longitude: 0 }) {
  return mount(FormLocationPicker, {
    props: { ...initial, address: '' },
    global: { stubs: { map: true } },
  })
}

/** 触发全屏选点并模拟用户在全屏里确认某个坐标 */
async function pickFromFullScreen(wrapper: ReturnType<typeof mountPicker>, lat: number, lng: number) {
  vi.mocked(uni.chooseLocation).mockImplementation((opts: any) => {
    opts.success?.({ name: '目标点', address: '测试地址', latitude: lat, longitude: lng })
    return undefined as any
  })
  ;(wrapper.vm as any).chooseLocation()
  await nextTick()
}

describe('form-location-picker 选点同步', () => {
  it('全屏选点确定后，卡片草稿与父组件表单同步（emit update:latitude/longitude/address）', async () => {
    const wrapper = mountPicker()
    await pickFromFullScreen(wrapper, 34.250001, 108.990001)

    expect(wrapper.emitted('update:latitude')?.at(-1), '全屏选点必须 emit 坐标').toEqual([34.250001])
    expect(wrapper.emitted('update:longitude')?.at(-1)).toEqual([108.990001])
    expect(wrapper.emitted('update:address')?.at(-1), '优先使用全屏选点的真实地点名称').toEqual(['目标点'])
  })

  it('全屏初始中心等于卡片当前草稿坐标（先卡片选点再跳全屏）', async () => {
    const wrapper = mountPicker()
    // 卡片内先选一个点（H5 高德 tap 事件自带经纬度）
    await wrapper.find('#locationPickerMap').trigger('tap', { detail: { latitude: 34.251, longitude: 108.991 } })
    // 再触发全屏选点：传给 chooseLocation 的初始中心必须来自草稿
    vi.mocked(uni.chooseLocation).mockImplementation((opts: any) => {
      expect(opts.latitude, 'chooseLocation 初始中心 = 卡片草稿纬度').toBe(34.251)
      expect(opts.longitude, 'chooseLocation 初始中心 = 卡片草稿经度').toBe(108.991)
      return undefined as any
    })
    ;(wrapper.vm as any).chooseLocation()
    await nextTick()
  })

  it('h5 点选与拖动地图仅更新内部预览草稿，未点击保存时不 emit 给父组件', async () => {
    const wrapper = mountPicker()
    // 点选
    await wrapper.find('#locationPickerMap').trigger('tap', { detail: { latitude: 34.26, longitude: 108.98 } })
    await nextTick()
    expect(wrapper.emitted('update:latitude'), '未点击保存时不向父组件 emit 坐标').toBeUndefined()

    // 点击右下角保存按钮后才 emit
    await wrapper.find('.absolute.bottom-3.right-3').trigger('click')
    await nextTick()
    expect(wrapper.emitted('update:latitude')?.at(-1)).toEqual([34.26])
    expect(wrapper.emitted('update:longitude')?.at(-1)).toEqual([108.98])
  })

  it('小程序点选（tap detail 带 x/y → pixelToCoordinate）更新内部草稿，点击保存后同步父组件', async () => {
    mapCtx.pixelToCoordinate.mockImplementation((opts: any) => {
      opts.success?.({ latitude: 34.27, longitude: 108.97 })
    })
    const wrapper = mountPicker()
    await wrapper.find('#locationPickerMap').trigger('tap', { detail: { x: 100, y: 200 } })
    await nextTick()

    expect(mapCtx.pixelToCoordinate, '小程序点选必须走 pixelToCoordinate').toHaveBeenCalledWith(expect.objectContaining({ x: 100, y: 200 }))
    expect(wrapper.emitted('update:latitude'), '未保存前不向父组件 emit').toBeUndefined()

    await wrapper.find('.absolute.bottom-3.right-3').trigger('click')
    await nextTick()
    expect(wrapper.emitted('update:latitude')?.at(-1)).toEqual([34.27])
    expect(wrapper.emitted('update:longitude')?.at(-1)).toEqual([108.97])
  })

  it('拖动结束（regionchange）仅更新内部草稿，保存确认后才同步父组件', async () => {
    vi.useFakeTimers()
    const wrapper = mountPicker()
    await wrapper.find('#locationPickerMap').trigger('regionchange', {
      detail: { type: 'end', causedBy: 'drag', centerLocation: { latitude: 34.28, longitude: 108.96 } },
    })
    vi.advanceTimersByTime(150)
    await nextTick()

    expect(wrapper.emitted('update:latitude'), '仅移动地图未保存时不 emit').toBeUndefined()

    await wrapper.find('.absolute.bottom-3.right-3').trigger('click')
    await nextTick()
    expect(wrapper.emitted('update:latitude')?.at(-1)).toEqual([34.28])
    expect(wrapper.emitted('update:longitude')?.at(-1)).toEqual([108.96])
  })

  it('定位成功更新草稿坐标，保存确认后 emit', async () => {
    vi.mocked(uni.getLocation).mockImplementation((opts: any) => {
      opts.success?.({ latitude: 34.3, longitude: 108.92 })
    })
    const wrapper = mountPicker()
    await (wrapper.vm as any).locate()
    await nextTick()

    expect(wrapper.emitted('update:latitude'), '定位后未保存不自动 emit').toBeUndefined()

    await wrapper.find('.absolute.bottom-3.right-3').trigger('click')
    await nextTick()
    expect(wrapper.emitted('update:latitude')?.at(-1)).toEqual([34.3])
    expect(wrapper.emitted('update:longitude')?.at(-1)).toEqual([108.92])
  })

  it('定位失败提示错误且不更新坐标', async () => {
    vi.mocked(uni.getLocation).mockImplementation((opts: any) => {
      opts.fail?.({ errMsg: 'getLocation:fail auth deny' })
    })
    const wrapper = mountPicker()
    await (wrapper.vm as any).locate()
    await nextTick()

    expect(uni.showToast).toHaveBeenCalledWith({ title: '定位失败，请检查定位权限', icon: 'none' })
    expect(wrapper.emitted('update:latitude'), '定位失败不得 emit 坐标').toBeUndefined()
  })

  it('相同坐标不重复 emit（防 emit 回写循环）', async () => {
    const wrapper = mountPicker()
    await pickFromFullScreen(wrapper, 34.25, 108.99)
    const emitCount = wrapper.emitted('update:latitude')?.length ?? 0
    // 再次确认同一个点
    await pickFromFullScreen(wrapper, 34.25, 108.99)
    expect(wrapper.emitted('update:latitude')?.length).toBe(emitCount)
  })

  it('父组件回写 props 后，卡片草稿跟随且不产生多余 emit', async () => {
    const wrapper = mountPicker()
    await wrapper.setProps({ latitude: 34.31, longitude: 108.93 })
    await nextTick()

    // 地图组件收到的新中心
    const mapEl = wrapper.find('#locationPickerMap')
    expect(mapEl.attributes('latitude')).toBe('34.31')
    expect(mapEl.attributes('longitude')).toBe('108.93')
    expect(wrapper.emitted('update:latitude'), 'props 回写不得反向 emit').toBeUndefined()
  })

  it('重置（叉号）后父组件清空为 0,0', async () => {
    const wrapper = mountPicker()
    await pickFromFullScreen(wrapper, 34.25, 108.99)
    await wrapper.find('.absolute.bottom-3.left-3').trigger('click')
    await nextTick()

    expect(wrapper.emitted('update:latitude')?.at(-1)).toEqual([0])
    expect(wrapper.emitted('update:longitude')?.at(-1)).toEqual([0])
    expect(wrapper.emitted('update:address')?.at(-1)).toEqual([''])
  })
})
