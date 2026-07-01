<template>
  <view class="form-field">
    <view class="field-top">
      <text class="form-label">{{ labelText }}</text>
      <view class="field-action" @tap="chooseLocation">
        <wd-icon name="location" color="#1f1b14" size="24rpx" />
        <text class="field-action__text">{{ t('common.choose') }}</text>
      </view>
    </view>
    <view class="location-box" @tap="chooseLocation">
      <text class="location-box__name">{{ locationName }}</text>
      <text v-if="address" class="location-box__address">{{ address }}</text>
      <text v-if="hasLocation" class="location-box__coord">
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

<style scoped lang="scss">
.form-label,
.field-action__text,
.location-box__name,
.location-box__address,
.location-box__coord {
  display: block;
}

.field-action {
  display: flex;
  align-items: center;
  gap: 6rpx;
  height: 52rpx;
  padding: 0 18rpx;
  background: var(--tx-color-primary);
  border-radius: 999rpx;
}

.field-action__text {
  font-size: 24rpx;
  font-weight: 900;
  color: #1f1b14;
}
</style>
