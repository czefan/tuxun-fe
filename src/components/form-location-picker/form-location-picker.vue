<script setup lang="ts">
import { computed, getCurrentInstance, onBeforeUnmount, ref, watch } from 'vue'
import { isSubmittableLocation, locate } from '@/composables/use-map'

interface Props {
  address?: string
  latitude: number
  longitude: number
  selectedText?: string
}

defineOptions({
  options: {
    virtualHost: true,
  },
})

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
let choosingLocation = false
let disposed = false
const mapScale = ref(15)
let mapRevision = 0
const DEFAULT_LAT = 34.24623
const DEFAULT_LNG = 108.98374

const hasInitialLocation = isSubmittableLocation(props.latitude, props.longitude)
const draftLat = ref<number>(hasInitialLocation ? props.latitude : DEFAULT_LAT)
const draftLng = ref<number>(hasInitialLocation ? props.longitude : DEFAULT_LNG)
const lastSavedLat = ref<number>(props.latitude || 0)
const lastSavedLng = ref<number>(props.longitude || 0)
const isSubmittable = computed(() => isSubmittableLocation(props.latitude, props.longitude))

let moveTimer: ReturnType<typeof setTimeout> | null = null

function getMapCtx(): any {
  return uni.createMapContext('locationPickerMap', instance?.proxy)
}

function moveTo(lat: number, lng: number) {
  if (moveTimer) clearTimeout(moveTimer)
  moveTimer = setTimeout(() => {
    moveTimer = null
    try {
      getMapCtx()?.moveToLocation?.({ latitude: lat, longitude: lng })
    } catch {}
  }, 100)
}

/**
 * 统一更新本地选点草稿坐标（不向父组件 emit，仅在点击保存或全屏选点确认时才保存）
 * @param lat 纬度
 * @param lng 经度
 * @param options.shouldMove 是否需要驱动地图平移（手势拖动时为 false，程序驱动定位/全屏选点时为 true）
 */
function updateDraft(lat: number, lng: number, options: { shouldMove?: boolean } = {}) {
  const nLat = Number(lat.toFixed(6))
  const nLng = Number(lng.toFixed(6))
  if (!isSubmittableLocation(nLat, nLng)) return

  const isSameCoord =
    Math.abs(draftLat.value - nLat) < 1e-6 && Math.abs(draftLng.value - nLng) < 1e-6
  if (!isSameCoord) mapRevision++
  draftLat.value = nLat
  draftLng.value = nLng

  if (options.shouldMove && !isSameCoord) {
    moveTo(nLat, nLng)
  }
}

/** 监听父组件传入坐标变更（如初次回填、外部重置等） */
watch(
  () => [props.latitude, props.longitude],
  ([lat, lng]) => {
    const nLat = Number(lat) || 0
    const nLng = Number(lng) || 0
    lastSavedLat.value = nLat
    lastSavedLng.value = nLng

    if (!isSubmittableLocation(nLat, nLng)) return

    // 如果与当前草稿一致（通常是内部 emit 引起的父组件回写），不重复平移地图
    if (Math.abs(draftLat.value - nLat) >= 1e-6 || Math.abs(draftLng.value - nLng) >= 1e-6) {
      draftLat.value = nLat
      draftLng.value = nLng
      moveTo(nLat, nLng)
    }
  },
  { immediate: true },
)

/** 读取当前地图中心并同步（手势拖动结束时调用，不执行 moveTo） */
function syncFromCenter(mapCtx: any = getMapCtx()) {
  const revision = mapRevision
  mapCtx?.getCenterLocation?.({
    success: (res: any) => {
      if (revision !== mapRevision) return
      if (isSubmittableLocation(res?.latitude, res?.longitude)) {
        updateDraft(res.latitude, res.longitude, { shouldMove: false })
      }
    },
  })
}

/** 点击地图落点 */
function handleMapTap(e: any) {
  if (choosingLocation) return
  const d = e?.detail || {}
  const lat = Number(d.latitude ?? d.lat ?? e?.latitude ?? e?.lat)
  const lng = Number(d.longitude ?? d.lng ?? e?.longitude ?? e?.lng)
  if (isSubmittableLocation(lat, lng)) {
    updateDraft(lat, lng, { shouldMove: true })
    return
  }

  // 小程序端通过像素坐标转换为经纬度
  const mapCtx = getMapCtx()
  const { x, y } = d
  if (typeof mapCtx?.pixelToCoordinate === 'function' && Number.isFinite(x) && Number.isFinite(y)) {
    const revision = mapRevision
    mapCtx.pixelToCoordinate({
      x,
      y,
      success: (res: any) => {
        if (revision !== mapRevision) return
        if (isSubmittableLocation(res?.latitude, res?.longitude)) {
          updateDraft(res.latitude, res.longitude, { shouldMove: true })
        }
      },
      fail: () => {
        if (revision === mapRevision) syncFromCenter(mapCtx)
      },
    })
  } else {
    syncFromCenter(mapCtx)
  }
}

/**
 * 拖动 / 缩放结束：更新中心点坐标
 * 注意：手势结束时地图中心已在目标位置，千万不可调用 moveToLocation，否则会导致回弹抖动
 */
function handleRegionChange(e: any) {
  if (choosingLocation) return
  const d = e?.detail || {}
  if (Number.isFinite(d.scale)) mapScale.value = d.scale
  const type = d.type || e?.type
  if (type && type !== 'end' && type !== 'regionchange') return

  const c = d.centerLocation
  if (c && isSubmittableLocation(Number(c.latitude), Number(c.longitude))) {
    updateDraft(Number(c.latitude), Number(c.longitude), { shouldMove: false })
    return
  }
  syncFromCenter()
}

/** 右下角对勾：保存确认 */
function handleConfirm() {
  clearPendingMapWork()
  const isSame =
    Math.abs(lastSavedLat.value - draftLat.value) < 1e-6 &&
    Math.abs(lastSavedLng.value - draftLng.value) < 1e-6
  if (!isSame) {
    lastSavedLat.value = draftLat.value
    lastSavedLng.value = draftLng.value
    emit('update:latitude', draftLat.value)
    emit('update:longitude', draftLng.value)
    emit('update:address', props.address || props.selectedText)
  }
  uni.showToast({ title: '已保存坐标', icon: 'success' })
}

/** 左下角叉号：重置默认坐标 */
function handleReset() {
  clearPendingMapWork()
  draftLat.value = DEFAULT_LAT
  draftLng.value = DEFAULT_LNG
  moveTo(DEFAULT_LAT, DEFAULT_LNG)
  lastSavedLat.value = 0
  lastSavedLng.value = 0
  emit('update:latitude', 0)
  emit('update:longitude', 0)
  emit('update:address', '')
  uni.showToast({ title: '已复位默认坐标', icon: 'none' })
}

/** GPS 定位 */
async function locate_() {
  const revision = mapRevision
  const coords = await locate()
  if (revision !== mapRevision) return
  if (coords) {
    updateDraft(coords.latitude, coords.longitude, { shouldMove: true })
  } else {
    uni.showToast({ title: '定位失败，请检查定位权限', icon: 'none' })
  }
}

/** 微信原生腾讯地图选址页；全屏界面完全由微信提供，不渲染本项目组件。 */
function chooseLocation_() {
  if (choosingLocation || disposed) return
  clearPendingMapWork()
  choosingLocation = true

  try {
    uni.chooseLocation({
      latitude: draftLat.value,
      longitude: draftLng.value,
      success: (res) => {
        if (disposed) return
        const lat = Number(res.latitude)
        const lng = Number(res.longitude)
        if (!isSubmittableLocation(lat, lng)) {
          uni.showToast({ title: '未获取到有效坐标，请重新选择', icon: 'none' })
          return
        }
        updateDraft(lat, lng, { shouldMove: true })
        const address = res.name || res.address || props.selectedText
        const changed =
          Math.abs(lastSavedLat.value - draftLat.value) >= 1e-6 ||
          Math.abs(lastSavedLng.value - draftLng.value) >= 1e-6
        lastSavedLat.value = draftLat.value
        lastSavedLng.value = draftLng.value
        if (changed) {
          emit('update:latitude', draftLat.value)
          emit('update:longitude', draftLng.value)
        }
        // 相同坐标也可能选中了不同的地点名称。
        emit('update:address', address)
        uni.showToast({ title: '已保存坐标', icon: 'success' })
      },
      fail: handleChooseLocationError,
      complete: () => {
        choosingLocation = false
      },
    })
  } catch (error) {
    choosingLocation = false
    handleChooseLocationError(error)
  }
}

function handleChooseLocationError(error: unknown) {
  if (disposed) return
  const message =
    error instanceof Error ? error.message : String((error as { errMsg?: string })?.errMsg || '')
  if (/cancel/i.test(message)) return
  // 原始错误可能很长，用弹窗完整展示，避免 Toast 截断关键信息。
  uni.showModal({
    title: '地图打开失败',
    content: message || '未知错误',
    showCancel: false,
  })
}

function clearPendingMapWork() {
  mapRevision++
  if (moveTimer) clearTimeout(moveTimer)
  moveTimer = null
}

onBeforeUnmount(() => {
  disposed = true
  clearPendingMapWork()
})

defineExpose({ locate: locate_, chooseLocation: chooseLocation_, isSubmittable })
</script>

<template>
  <view class="space-y-2">
    <!-- 内嵌小地图 -->
    <view class="relative h-60 overflow-hidden rounded-2xl ring-1 ring-tx-border/60">
      <map
        id="locationPickerMap"
        class="h-60 w-full"
        :latitude="draftLat"
        :longitude="draftLng"
        :scale="mapScale"
        show-location
        @tap="handleMapTap"
        @click="handleMapTap"
        @regionchange="handleRegionChange"
      />

      <!-- 中心固定选点针 -->
      <view
        class="pointer-events-none absolute left-1/2 top-1/2 z-10 transform -translate-x-1/2 -translate-y-full"
      >
        <text class="i-carbon-location-filled block text-[24px] text-rose-500 drop-shadow-md" />
      </view>

      <!-- 左下角叉号按钮：重置 -->
      <view
        class="absolute bottom-3 left-3 z-20 h-9 w-9 flex cursor-pointer items-center justify-center rounded-full bg-white/95 text-gray-600 shadow-md transition-transform active:scale-90"
        @click.stop="handleReset"
      >
        <wd-icon name="close" size="18px" color="#4B5563" />
      </view>

      <!-- 右下角对勾按钮：保存确认 -->
      <view
        class="absolute bottom-3 right-3 z-20 h-9 w-9 flex cursor-pointer items-center justify-center rounded-full bg-emerald-500 text-white shadow-md transition-transform active:scale-90"
        @click.stop="handleConfirm"
      >
        <wd-icon name="check" size="18px" color="#FFFFFF" />
      </view>
    </view>
  </view>
</template>
