<script setup lang="ts">
import { computed } from 'vue'

export type TagStatus = 'pending' | 'wrong' | 'correct' | 'approved' | 'rejected' | 'solved' | 'unsolved'

defineOptions({
  options: {
    virtualHost: true,
  },
})

const props = defineProps<{
  status: TagStatus
}>()

const isPending = computed(() => props.status === 'pending')
const isSuccess = computed(() => props.status === 'approved' || props.status === 'correct' || props.status === 'solved')
</script>

<template>
  <view class="relative inline-flex flex-shrink-0 items-center justify-center transition-transform active:scale-90">
    <!-- 图标中心白色不透明填充块（17px，刚好覆盖 25px 图标中间镂空部位，25px 外边缘被黄色/绿色/红色图标遮盖不露白） -->
    <view class="absolute h-[17px] w-[17px] rounded-full bg-white" />

    <!-- 1. 审核中 (Pending) - WOT 官方实心时钟图标 clock-circle-fill (25px) -->
    <wd-icon v-if="isPending" name="clock-circle-fill" size="25px" color="#F59E0B" custom-class="relative z-1 !leading-none block drop-shadow-2xs" />

    <!-- 2. 已通过 / 已破解 / 作答正确 (Success) - WOT 官方实心对勾圆图标 check-circle-fill (25px) -->
    <wd-icon v-else-if="isSuccess" name="check-circle-fill" size="25px" color="#10B981" custom-class="relative z-1 !leading-none block drop-shadow-2xs" />

    <!-- 3. 未通过 / 已驳回 / 作答错误 (Error) - WOT 官方实心叉号圆图标 close-circle-fill (25px) -->
    <wd-icon v-else name="close-circle-fill" size="25px" color="#F43F5E" custom-class="relative z-1 !leading-none block drop-shadow-2xs" />
  </view>
</template>
