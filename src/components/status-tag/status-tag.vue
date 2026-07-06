<template>
  <view
    class="inline-flex flex-shrink-0 items-center justify-center rounded-full px-16rpx py-6rpx"
    :class="statusClassMap[status]"
  >
    <text class="block translate-y-[0.5rpx] text-24rpx font-900 leading-none">{{ labelText }}</text>
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

const statusClassMap: Record<TagStatus, string> = {
  pending: 'bg-[#f5c542]/22 text-[#9b7621]',
  wrong: 'bg-[#e45064]/14 text-[#d9435b]',
  rejected: 'bg-[#e45064]/14 text-[#d9435b]',
  correct: 'bg-[#42a661]/16 text-[#2f8f4c]',
  approved: 'bg-[#42a661]/16 text-[#2f8f4c]',
}

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
