<script setup lang="ts">
import { computed, getCurrentInstance, ref, watch } from 'vue'
import { isSubmittableLocation, locate } from '@/composables/use-map'

interface Props {
  address?: string
  latitude: number
  longitude: number
  selectedText?: string
}

const props = withDefaults(defineProps<Props>(), {
  address: '',
  selectedText: '已选择地点',
})

const emit = defineEmits<{
  (e: 'update:address', val: string): void
  (e: 'update:latitude', val: number): void
  (e: 'update:longitude', val: number): void
}>()

const instance = getCurrentInstance()
const DEFAULT_LAT = 34.24623
const DEFAULT_LNG = 108.98374

const draftLat = ref<number>(props.latitude || DEFAULT_LAT)
const draftLng = ref<number>(props.longitude || DEFAULT_LNG)
const isSubmittable = computed(() => isSubmittableLocation(props.latitude, props.longitude))

watch(
  () => [props.latitude, props.longitude],
  ([lat, lng]) => {
    if (!Number(lat) || !Number(lng))
      return
    const nLat = Number(lat)
    const nLng = Number(lng)
    // 值相同不重复移动，避免与 emit 回写形成无意义循环
    if (draftLat.value !== nLat || draftLng.value !== nLng) {
      draftLat.value = nLat
      draftLng.value = nLng
      moveTo(nLat, nLng)
    }
  },
  { immediate: true },
)

function getMapCtx(): any {
  return uni.createMapContext('locationPickerMap', instance as any)
}

function moveTo(lat: number, lng: number) {
  setTimeout(() => {
    try {
      getMapCtx()?.moveToLocation?.({ latitude: lat, longitude: lng })
    }
    catch {}
  }, 200)
}

/**
 * 任一入口（点选 / 全屏 / GPS / 拖动）落点后统一处理：
 * 更新草稿坐标、移动地图中心，并立即 emit 同步到父组件——
 * 否则全屏选点回来父组件表单还是旧值，与卡片地图显示脱节。
 */
function updateDraft(lat: number, lng: number) {
  const nLat = Number(lat.toFixed(6))
  const nLng = Number(lng.toFixed(6))
  if (!nLat || !nLng)
    return
  // 相同值跳过：拖动结束回读中心、emit 回写都会走到这里，不能反复 emit
  if (draftLat.value === nLat && draftLng.value === nLng)
    return
  draftLat.value = nLat
  draftLng.value = nLng
  moveTo(nLat, nLng)
  emit('update:latitude', nLat)
  emit('update:longitude', nLng)
  emit('update:address', props.selectedText)
}

/** 兜底：读取当前地图中心并同步（拖动结束也走这里） */
function syncFromCenter(mapCtx: any = getMapCtx()) {
  mapCtx?.getCenterLocation?.({
    success: (res: any) => res?.latitude && updateDraft(res.latitude, res.longitude),
  })
}

function handleMapTap(e: any) {
  const d = e?.detail || {}
  // 部分实现（如旧版 H5）点击事件自带经纬度
  const lat = Number(d.latitude ?? d.lat ?? e?.latitude ?? e?.lat)
  const lng = Number(d.longitude ?? d.lng ?? e?.longitude ?? e?.lng)
  if (lat && lng) {
    updateDraft(lat, lng)
    return
  }

  // 小程序点击事件 detail 只有像素坐标 x/y，用 pixelToCoordinate 转成经纬度原地插针
  const mapCtx = getMapCtx()
  const { x, y } = d
  if (typeof mapCtx?.pixelToCoordinate === 'function' && Number.isFinite(x) && Number.isFinite(y)) {
    mapCtx.pixelToCoordinate({
      x,
      y,
      success: (res: any) => res?.latitude && updateDraft(res.latitude, res.longitude),
      fail: () => syncFromCenter(mapCtx),
    })
  }
  else {
    syncFromCenter(mapCtx)
  }
}

/**
 * 拖动 / 缩放结束：把地图新中心回写 draft，保证中心针指向的数据与地图一致。
 * - H5（高德，uni-h5 实现）：regionchange 的 detail 自带 centerLocation
 * - 小程序（微信原生）：detail 只有 type/causedBy，用 getCenterLocation 读中心
 */
function handleRegionChange(e: any) {
  const d = e?.detail || {}
  if (d.type && d.type !== 'end')
    return
  const c = d.centerLocation
  if (c && Number(c.latitude) && Number(c.longitude)) {
    updateDraft(c.latitude, c.longitude)
    return
  }
  syncFromCenter()
}

/** 右下角对勾：保存确认 */
function handleConfirm() {
  emit('update:latitude', draftLat.value)
  emit('update:longitude', draftLng.value)
  emit('update:address', props.selectedText)
  uni.showToast({ title: '已保存坐标', icon: 'success' })
}

/** 左下角叉号：重置默认（直接置空，避免 updateDraft 先 emit 一次中间值） */
function handleReset() {
  draftLat.value = DEFAULT_LAT
  draftLng.value = DEFAULT_LNG
  moveTo(DEFAULT_LAT, DEFAULT_LNG)
  emit('update:latitude', 0)
  emit('update:longitude', 0)
  emit('update:address', '')
  uni.showToast({ title: '已复位默认坐标', icon: 'none' })
}

/** GPS 定位（失败时提示，不静默失败） */
async function locate_() {
  const coords = await locate()
  if (coords) {
    updateDraft(coords.latitude, coords.longitude)
  }
  else {
    uni.showToast({ title: '定位失败，请检查定位权限', icon: 'none' })
  }
}

/**
 * 全屏选点：仅小程序端入口存在（微信原生 chooseLocation 支持拖动后直接
 * 确认中心，无 POI 列表限制）。H5 端不提供入口，卡片内选点即完整交互。
 */
function chooseLocation_() {
  uni.chooseLocation({
    latitude: draftLat.value,
    longitude: draftLng.value,
    success: (res: any) => {
      const lat = Number(res?.latitude ?? res?.lat)
      const lng = Number(res?.longitude ?? res?.lng)
      if (lat && lng) {
        updateDraft(lat, lng)
      }
    },
  })
}

defineExpose({ locate: locate_, chooseLocation: chooseLocation_, isSubmittable })
</script>

<template>
  <view class="space-y-2">
    <!-- 内嵌小地图 -->
    <view class="relative overflow-hidden rounded-2xl ring-1 ring-[#D3BA9F]/60">
      <map
        id="locationPickerMap"
        class="h-60 w-full"
        :latitude="draftLat"
        :longitude="draftLng"
        :scale="15"
        show-location
        @tap="handleMapTap"
        @click="handleMapTap"
        @regionchange="handleRegionChange"
      />

      <!-- 中心选点针 -->
      <view class="pointer-events-none absolute left-1/2 top-1/2 z-10 transform -translate-x-1/2 -translate-y-full">
        <text class="i-carbon:location-filled block text-[24px] text-rose-500 drop-shadow-md" />
      </view>

      <!-- 左下角叉号按钮 -->
      <view
        class="absolute bottom-3 left-3 z-20 h-9 w-9 flex cursor-pointer items-center justify-center rounded-full bg-white/95 text-gray-600 shadow-md transition-transform active:scale-90"
        @click.stop="handleReset"
      >
        <wd-icon name="close" size="18px" color="#4B5563" />
      </view>

      <!-- 右下角对勾按钮 -->
      <view
        class="absolute bottom-3 right-3 z-20 h-9 w-9 flex cursor-pointer items-center justify-center rounded-full bg-emerald-500 text-white shadow-md transition-transform active:scale-90"
        @click.stop="handleConfirm"
      >
        <wd-icon name="check" size="18px" color="#FFFFFF" />
      </view>
    </view>
  </view>
</template>
