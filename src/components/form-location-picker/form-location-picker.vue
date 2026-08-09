<script setup lang="ts">
import { computed, getCurrentInstance } from 'vue'
import { isSubmittableLocation, locate } from '@/composables/use-map'

interface Props {
  address?: string
  latitude: number
  longitude: number
  selectedText?: string
  unselectedText?: string
}

const props = withDefaults(defineProps<Props>(), {
  address: '',
  selectedText: '已选择地点',
  unselectedText: '点击地图选取坐标',
})

const emit = defineEmits<{
  (e: 'update:address', val: string): void
  (e: 'update:latitude', val: number): void
  (e: 'update:longitude', val: number): void
}>()

const instance = getCurrentInstance()

const hasLocation = computed(() => props.latitude !== 0 || props.longitude !== 0)

/** 选点是否可提交：与投稿/作答页共用同一套 isSubmittableLocation 校验，避免各写各的 */
const isSubmittable = computed(() => isSubmittableLocation(props.latitude, props.longitude))

const mapCenter = computed(() => ({
  latitude: hasLocation.value ? props.latitude : 39.9087,
  longitude: hasLocation.value ? props.longitude : 116.3975,
}))

/** 使用默认图钉 (iconPath 必填，传空串时小程序显示默认红钉) */
const markers = computed(() =>
  hasLocation.value
    ? [{ id: 1, latitude: props.latitude, longitude: props.longitude, iconPath: '', width: 32, height: 32 }]
    : [],
)

const locationLabel = computed(() =>
  props.address || (hasLocation.value ? props.selectedText : props.unselectedText),
)

/** 点击地图：用 pixelToCoordinate 直接在原地插针，不跳转任何全屏页 */
function handleMapTap(e: any) {
  const { x, y } = e.detail
  const mapCtx = uni.createMapContext('locationPickerMap', instance as any) as any
  mapCtx.pixelToCoordinate({
    x,
    y,
    success: (res: any) => {
      emit('update:latitude', res.latitude)
      emit('update:longitude', res.longitude)
      emit('update:address', '手动选点')
    },
  })
}

/** GPS 定位（父组件通过 ref 调用） */
async function locate_() {
  const coords = await locate()
  if (coords) {
    emit('update:latitude', coords.latitude)
    emit('update:longitude', coords.longitude)
    emit('update:address', '当前位置')
    uni.showToast({ title: '已定位到当前位置', icon: 'success' })
  }
  else {
    uni.showToast({ title: '定位失败，请手动点击地图选点', icon: 'none' })
  }
}

/** 全屏地图选点（父组件通过 ref 调用，或全屏按钮触发） */
function chooseLocation_() {
  uni.chooseLocation({
    success: (res) => {
      const name = res.name || res.address || props.selectedText!
      emit('update:address', name)
      emit('update:latitude', Number(res.latitude) || 0)
      emit('update:longitude', Number(res.longitude) || 0)
    },
    fail: () => {
      uni.showToast({ title: '地图调用失败，请重试', icon: 'none' })
    },
  })
}

defineExpose({ locate: locate_, chooseLocation: chooseLocation_, isSubmittable })
</script>

<template>
  <view class="space-y-2">
    <!-- 内嵌小地图：点击原地插针，不跳转 -->
    <view class="overflow-hidden rounded-2xl ring-1 ring-[#D3BA9F]/60">
      <map
        id="locationPickerMap"
        class="h-44 w-full"
        :latitude="mapCenter.latitude"
        :longitude="mapCenter.longitude"
        :markers="(markers as any)"
        :scale="15"
        show-location
        @tap="handleMapTap"
      />
    </view>

    <!-- 已选坐标说明 -->
    <view class="px-0.5">
      <text class="block text-sm text-[#1E1E1E] font-bold">{{ locationLabel }}</text>
      <text v-if="hasLocation" class="font-num mt-0.5 block text-xs text-[#756C5E]">
        {{ latitude.toFixed(6) }}, {{ longitude.toFixed(6) }}
      </text>
      <text v-if="hasLocation && !isSubmittable" class="mt-0.5 block text-xs text-rose-500 font-bold">
        坐标超出可提交范围，请重新选点
      </text>
    </view>
  </view>
</template>
