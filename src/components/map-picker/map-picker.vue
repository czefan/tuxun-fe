<template>
  <view class="relative h-600rpx w-full">
    <map
      :id="mapId"
      class="h-full w-full"
      :latitude="center.latitude"
      :longitude="center.longitude"
      :scale="scale"
      show-location
      @regionchange="onRegionChange"
    />
    <view class="pointer-events-none absolute left-1/2 top-1/2 h-34rpx w-34rpx border-4rpx border-white rounded-[50%_50%_50%_0] border-solid bg-[#e54b3f] shadow-[0_8rpx_20rpx_rgba(31,27,20,0.18)] after:(absolute left-[11rpx] top-[11rpx] h-12rpx w-12rpx rounded-full bg-white content-['']) -translate-x-1/2 -translate-y-full -rotate-45" />
  </view>
</template>

<script setup lang="ts">
import { useMap } from '@/composables/useMap'

withDefaults(defineProps<{
  scale?: number
}>(), {
  scale: 15,
})

const emit = defineEmits<{
  (e: 'change', value: { latitude: number, longitude: number }): void
}>()

const mapId = 'map-picker-instance'
const { center, onRegionChange: _onRegionChange } = useMap()

function onRegionChange(e: any) {
  _onRegionChange(e as Parameters<typeof _onRegionChange>[0])
  if (e.type === 'end' && e.detail?.centerLocation) {
    emit('change', { ...e.detail.centerLocation })
  }
}
</script>
