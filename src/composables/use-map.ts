/**
 * 地图坐标转换及选点定位 Utility
 */

/** 坐标点 */
export interface LatLng {
  latitude: number
  longitude: number
}

/** 默认坐标系常量 */
export const DEFAULT_COORD_TYPE = 'gcj02' as const

const PI = Math.PI
const AXIS = 6378245.0
const OFFSET = 0.006693421622965943

function outOfChina(lat: number, lng: number): boolean {
  if (lng < 72.004 || lng > 137.8347)
    return true
  if (lat < 0.8293 || lat > 55.8271)
    return true
  return false
}

function transformLat(x: number, y: number): number {
  let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x))
  ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0
  ret += (20.0 * Math.sin(y * PI) + 40.0 * Math.sin(y / 3.0 * PI)) * 2.0 / 3.0
  ret += (160.0 * Math.sin(y / 12.0 * PI) + 320 * Math.sin(y * PI / 30.0)) * 2.0 / 3.0
  return ret
}

function transformLng(x: number, y: number): number {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))
  ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0
  ret += (20.0 * Math.sin(x * PI) + 40.0 * Math.sin(x / 3.0 * PI)) * 2.0 / 3.0
  ret += (150.0 * Math.sin(x / 12.0 * PI) + 300.0 * Math.sin(x / 30.0 * PI)) * 2.0 / 3.0
  return ret
}

/** WGS-84 转 GCJ-02。对外只暴露 normalizeToGcj02，这里不导出以免出现两套入口 */
function wgs84ToGcj02(lat: number, lng: number): LatLng {
  if (outOfChina(lat, lng)) {
    return { latitude: lat, longitude: lng }
  }
  let dLat = transformLat(lng - 105.0, lat - 35.0)
  let dLng = transformLng(lng - 105.0, lat - 35.0)
  const radLat = (lat / 180.0) * PI
  let magic = Math.sin(radLat)
  magic = 1 - OFFSET * magic * magic
  const sqrtMagic = Math.sqrt(magic)
  dLat = (dLat * 180.0) / (((AXIS * (1 - OFFSET)) / (magic * sqrtMagic)) * PI)
  dLng = (dLng * 180.0) / ((AXIS / sqrtMagic) * Math.cos(radLat) * PI)
  return {
    latitude: lat + dLat,
    longitude: lng + dLng,
  }
}

/** BD-09 转 GCJ-02。同上，不单独导出 */
function bd09ToGcj02(lat: number, lng: number): LatLng {
  const xPi = (PI * 3000.0) / 180.0
  const x = lng - 0.0065
  const y = lat - 0.006
  const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * xPi)
  const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * xPi)
  return {
    latitude: z * Math.sin(theta),
    longitude: z * Math.cos(theta),
  }
}

/** 统一归一化为 GCJ-02 坐标点 */
export function normalizeToGcj02(lat: number, lng: number, coordType?: 'wgs84' | 'gcj02' | 'bd09'): LatLng {
  if (coordType === 'wgs84') {
    return wgs84ToGcj02(lat, lng)
  }
  if (coordType === 'bd09') {
    return bd09ToGcj02(lat, lng)
  }
  return { latitude: lat, longitude: lng }
}

/**
 * 坐标是否可提交。
 *
 * 契约（api.md「上传投稿」「提交作答」）规定经度 -180~180、纬度 -90~90，
 * 越界后端返回 400 / code=5。这里在客户端先挡一道，手填入口尤其需要。
 *
 * `0, 0` 视为「未选点」而非合法坐标。
 */
export function isSubmittableLocation(latitude: number, longitude: number): boolean {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return false
  }
  if (latitude === 0 && longitude === 0) {
    return false
  }
  return Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180
}

/**
 * 获取当前定位坐标 (GCJ-02)
 * 拒绝授权/失败返回 null
 */
export async function locate(): Promise<LatLng | null> {
  return new Promise((resolve) => {
    uni.getLocation({
      type: DEFAULT_COORD_TYPE,
      success: res => resolve({ latitude: res.latitude, longitude: res.longitude }),
      fail: () => resolve(null),
    })
  })
}
