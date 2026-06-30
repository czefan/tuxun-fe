<template>
  <view class="map-picker">
    <map
      :id="mapId"
      class="map-picker__map"
      :latitude="center.latitude"
      :longitude="center.longitude"
      :scale="scale"
      show-location
      @regionchange="onRegionChange"
    />
    <view class="map-picker__pin" />
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

<style scoped>
.map-picker {
  position: relative;
  width: 100%;
  height: 600rpx;
}

.map-picker__map {
  width: 100%;
  height: 100%;
}

.map-picker__pin {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 34rpx;
  height: 34rpx;
  background: #e54b3f;
  border: 4rpx solid #ffffff;
  border-radius: 50% 50% 50% 0;
  box-shadow: 0 8rpx 20rpx rgba(31, 27, 20, 0.18);
  transform: translate(-50%, -100%) rotate(-45deg);
  pointer-events: none;
}

.map-picker__pin::after {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 12rpx;
  height: 12rpx;
  background: #ffffff;
  border-radius: 50%;
  content: '';
  transform: translate(-50%, -50%);
}
</style>
