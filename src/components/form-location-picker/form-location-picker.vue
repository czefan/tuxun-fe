<template>
  <view class="form-field">
    <view class="field-top">
      <text class="form-label block">{{ labelText }}</text>
      <view class="h-52rpx flex cursor-pointer items-center gap-6rpx rounded-full bg-brand px-18rpx" @tap="chooseLocation">
        <wd-icon name="location" color="#1f1b14" size="24rpx" />
        <text class="block text-24rpx text-[#1f1b14] font-900">{{ t('common.choose') }}</text>
      </view>
    </view>
    <view class="location-box" @tap="chooseLocation">
      <text class="location-box__name block">{{ locationName }}</text>
      <text v-if="address" class="location-box__address block">{{ address }}</text>
      <text v-if="hasLocation" class="location-box__coord block">
        {{ latitude.toFixed(6) }}, {{ longitude.toFixed(6) }}
      </text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { t } from '@/locale'

interface Props {
  address: string
  latitude: number
  longitude: number
  label?: string
  selectedText?: string
  unselectedText?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:address', val: string): void
  (e: 'update:latitude', val: number): void
  (e: 'update:longitude', val: number): void
}>()

const hasLocation = computed(() => props.latitude !== 0 || props.longitude !== 0)
const labelText = computed(() => props.label || t('common.location'))
const selectedText = computed(() => props.selectedText || t('common.locationSelected'))
const unselectedText = computed(() => props.unselectedText || t('common.locationUnselected'))

const locationName = computed(() =>
  props.address || (hasLocation.value ? selectedText.value : unselectedText.value),
)

function chooseLocation() {
  uni.chooseLocation({
    success: (res) => {
      const name = res.name || res.address || selectedText.value
      const lat = Number(res.latitude) || 0
      const lng = Number(res.longitude) || 0

      emit('update:address', name)
      emit('update:latitude', lat)
      emit('update:longitude', lng)
    },
    fail: () => {
      uni.showToast({
        title: unselectedText.value,
        icon: 'none',
      })
    },
  })
}
</script>
