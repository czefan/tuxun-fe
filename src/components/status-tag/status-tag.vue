<template>
  <view
    class="status-tag"
    :class="`status-tag--${status}`"
  >
    <text class="status-tag__text">{{ labelText }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { t } from '@/locale'

export type TagStatus = 'pending' | 'wrong' | 'correct' | 'approved' | 'rejected'

defineOptions({
  options: {
    virtualHost: true,
  },
})

const props = defineProps<{
  status: TagStatus
  label?: string
}>()

const labelText = computed(() => {
  const labelMap: Record<TagStatus, string> = {
    pending: t('status.pending'),
    wrong: t('status.wrong'),
    correct: t('status.correct'),
    approved: t('status.approved'),
    rejected: t('status.rejected'),
  }

  return props.label || labelMap[props.status]
})
</script>

<style scoped lang="scss">
.status-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
}

.status-tag--pending {
  background: rgba(245, 197, 66, 0.22);
}

.status-tag--wrong,
.status-tag--rejected {
  background: rgba(228, 80, 100, 0.14);
}

.status-tag--correct,
.status-tag--approved {
  background: rgba(66, 166, 97, 0.16);
}

.status-tag__text {
  display: block;
  font-size: 24rpx;
  font-weight: 900;
  line-height: 1;
  transform: translateY(0.5rpx);
}

.status-tag--pending .status-tag__text {
  color: #9b7621;
}

.status-tag--wrong .status-tag__text,
.status-tag--rejected .status-tag__text {
  color: #d9435b;
}

.status-tag--correct .status-tag__text,
.status-tag--approved .status-tag__text {
  color: #2f8f4c;
}
</style>
