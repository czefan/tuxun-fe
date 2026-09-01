<script setup lang="ts">
import { computed } from 'vue'
import LikeButton from '@/components/like-button/like-button.vue'
import ProgressiveImage from '@/components/progressive-image/progressive-image.vue'
import type { PhotoDetailVM } from '@/features/photo/types'

interface Props {
  question: PhotoDetailVM
  thumbUrl?: string | null
  isMe?: boolean
  buttonState: {
    text: string
    disabled: boolean
  }
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'preview-image'): void
  (e: 'toggle-like'): void
  (e: 'action'): void
}>()

const isTall = computed(() => {
  const img = props.question.image
  if (!img?.width || !img?.height) return false
  return img.height / img.width > 1.5
})
</script>

<template>
  <view class="shadow-2xs overflow-hidden border border-tx-border rounded-[18px] bg-white">
    <!-- 题目主图展示区（渐进式直切瞬时高清 + 统一全尺寸占位底色，最高 60vh 防长图霸屏） -->
    <ProgressiveImage
      :image="question.image"
      :thumb-url="thumbUrl"
      :mode="isTall ? 'aspectFit' : 'aspectFill'"
      max-height="60vh"
      custom-class="rounded-t-[18px]"
      :view-transition-name="`photo-cover-${question.id}`"
      @click="emit('preview-image')"
    />

    <view class="px-5 pb-5 pt-6 space-y-3.5">
      <text class="block u-title-page leading-snug">{{ question.title }}</text>
      <text v-if="question.description" class="block u-body-main">
        {{ question.description }}
      </text>

      <view v-if="question.activity?.title" class="pt-0.5">
        <text class="u-action-link text-base">#{{ question.activity.title }}</text>
      </view>

      <view class="flex items-center justify-between border-t border-tx-border/30 pt-3">
        <view class="flex items-center gap-2.5">
          <wd-img
            custom-class="h-9 w-9 rounded-full ring-2 ring-tx-border"
            :src="question.author.avatar || '/static/images/default-avatar.png'"
            lazy-load
            mode="aspectFill"
            round
            width="72rpx"
            height="72rpx"
          />
          <view class="flex flex-col">
            <view class="min-w-0 flex items-center">
              <text class="truncate u-user-name font-bold">{{ question.author.nickname }}</text>
              <text
                v-if="isMe"
                class="ml-1 flex-shrink-0 rounded bg-tx-brown/15 px-1 py-0.2 text-[10px] text-tx-brown font-bold leading-none"
              >
                我
              </text>
            </view>
            <text v-if="question.createdAt" class="mt-0.5 u-meta-time">
              {{ question.createdAt }}
            </text>
          </view>
        </view>
        <like-button
          :liked="question.liked"
          :count="question.likesCount"
          icon-size="20px"
          font-size="15px"
          @click="emit('toggle-like')"
        />
      </view>

      <!-- 主答题行动入口 (CTA Button) -->
      <view class="pt-1">
        <wd-button
          type="warning"
          round
          block
          size="large"
          custom-class="!font-black !bg-tx-accent !text-tx-ink !border-0 shadow-2xs active:scale-[0.99] transition-transform"
          :disabled="buttonState.disabled"
          @click="emit('action')"
        >
          {{ buttonState.text }}
        </wd-button>
      </view>
    </view>
  </view>
</template>
