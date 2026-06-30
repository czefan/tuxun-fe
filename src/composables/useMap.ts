/**
 * 地图中心点防抖更新 & 坐标处理 Composable
 */
import { ref } from 'vue'

/** 坐标点 */
export interface LatLng {
  latitude: number
  longitude: number
}

/**
 * 地图交互逻辑组合式函数
 * @param debounceMs 防抖延迟（毫秒），默认 300
 */
export function useMap(debounceMs = 300) {
  const center = ref<LatLng>({ latitude: 39.9042, longitude: 116.4074 }) // 默认北京
  let timer: ReturnType<typeof setTimeout> | null = null

  /**
   * 处理地图 regionchange 事件（带防抖）
   * 在 <map @regionchange="onRegionChange"> 中使用
   */
  function onRegionChange(e: { type: string, detail?: { centerLocation?: LatLng } }) {
    if (e.type !== 'end')
      return

    if (timer)
      clearTimeout(timer)
    timer = setTimeout(() => {
      if (e.detail?.centerLocation) {
        center.value = {
          latitude: e.detail.centerLocation.latitude,
          longitude: e.detail.centerLocation.longitude,
        }
      }
    }, debounceMs)
  }

  /** 手动设置中心点 */
  function setCenter(lat: number, lng: number) {
    center.value = { latitude: lat, longitude: lng }
  }

  return {
    center,
    onRegionChange,
    setCenter,
  }
}
