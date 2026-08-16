<script setup lang="ts">
import { computed } from 'vue'
import { DEFAULT_COORD_TYPE, normalizeToGcj02 } from '@/composables/use-map'

defineOptions({
  options: {
    virtualHost: true,
  },
})

const props = withDefaults(defineProps<Props>(), {
  coordType: DEFAULT_COORD_TYPE,
  title: '答案正确坐标',
})

interface Props {
  latitude: number
  longitude: number
  /** 后端下发的坐标系 */
  coordType?: 'wgs84' | 'gcj02' | 'bd09'
  title?: string
}

/**
 * H5 端 `<map>` 必须配高德 key 才能渲染。
 * 小程序端 `<map>` 是原生组件，恒可渲染。
 */
const canRenderMap = computed(() => {
  // #ifdef H5
  return Boolean(import.meta.env.VITE_AMAP_KEY)
  // #endif

  return true
})

/** 转算为适合 `<map>` 与 uni.openLocation 使用的 GCJ-02 坐标点 */
const normalizedLocation = computed(() =>
  normalizeToGcj02(props.latitude, props.longitude, props.coordType),
)

/** 打开全屏交互地图 */
function openFullScreenMap() {
  uni.openLocation({
    latitude: normalizedLocation.value.latitude,
    longitude: normalizedLocation.value.longitude,
    name: props.title,
    scale: 16,
  })
}
</script>

<template>
  <view class="photo-location-view shadow-2xs border border-[#D3BA9F] rounded-[18px] bg-white p-4 space-y-3">
    <!-- 头部区：地标标题与右侧融入背景的全屏入口 -->
    <view class="flex items-center justify-between">
      <view class="flex items-center gap-1.5 u-title-base font-bold">
        <wd-icon name="location" size="18px" color="#B69171" />
        <text>{{ title }}</text>
      </view>
      <view
        class="flex cursor-pointer items-center gap-0.5 text-xs text-[#B69171] font-medium transition-opacity active:opacity-70"
        @click="openFullScreenMap"
      >
        <text>全屏查看</text>
        <text class="i-carbon:chevron-right text-xs text-[#B69171]" />
      </view>
    </view>

    <!-- 地图卡片主体：点击全屏打开地图 -->
    <view
      class="group relative h-48 w-full cursor-pointer overflow-hidden rounded-[14px] bg-[#F1DFC5]/30 ring-1 ring-[#D3BA9F]/40"
      @click="openFullScreenMap"
    >
      <map
        v-if="canRenderMap"
        class="pointer-events-none h-full w-full"
        :latitude="normalizedLocation.latitude"
        :longitude="normalizedLocation.longitude"
        :scale="15"
        :enable-scroll="false"
        :enable-zoom="false"
      />
      <view v-else class="h-full w-full flex items-center justify-center bg-[#F1DFC5]/40">
        <text class="text-xs text-[#756C5E] font-bold">点击打开地图查看位置</text>
      </view>

      <!-- 答案中心定位针：与选点卡片完全一致的实心填充图标 i-carbon:location-filled -->
      <view class="pointer-events-none absolute left-1/2 top-1/2 z-10 transform -translate-x-1/2 -translate-y-full">
        <text class="i-carbon:location-filled block text-[24px] text-rose-500 drop-shadow-md" />
      </view>
    </view>
  </view>
</template>
