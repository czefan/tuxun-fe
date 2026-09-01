<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import LikeButton from '@/components/like-button/like-button.vue'
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

const isOriginLoaded = ref(false)

watch(
  () => props.question.id,
  () => {
    isOriginLoaded.value = false
  },
)

const isTall = computed(() => {
  const img = props.question.image
  if (!img?.width || !img?.height) return false
  return img.height / img.width > 1.5
})
</script>

<template>
  <view class="shadow-2xs overflow-hidden border border-tx-border rounded-[18px] bg-white">
    <!-- 题目主图展示区（宽高比自适应 + 统一全尺寸占位底色，最高 60vh 防长图霸屏） -->
    <view
      class="relative w-full overflow-hidden rounded-t-[18px] bg-tx-brown/10"
      :style="{
        aspectRatio:
          question.image?.width && question.image?.height
            ? `${question.image.width} / ${question.image.height}`
            : '4 / 3',
        maxHeight: '60vh',
      }"
    >
      <!-- 缩略图占位层：秒级就绪 -->
      <image
        v-if="thumbUrl && !isOriginLoaded"
        class="block h-full w-full cursor-pointer"
        :src="thumbUrl"
        :mode="isTall ? 'aspectFit' : 'aspectFill'"
        @click="emit('preview-image')"
      />

      <!-- 高清原图层：后台静默加载完成后淡入覆盖 -->
      <image
        class="block h-full w-full cursor-pointer transition-opacity duration-300"
        :class="[
          thumbUrl && !isOriginLoaded ? 'opacity-0' : 'opacity-100',
          thumbUrl ? 'absolute inset-0' : '',
        ]"
        :style="{
          'view-transition-name': `photo-cover-${question.id}`,
        }"
        :src="question.image.originUrl"
        :mode="isTall ? 'aspectFit' : 'aspectFill'"
        @load="isOriginLoaded = true"
        @click="emit('preview-image')"
      />

      <!-- 未加载完成且无缩略图时的全局优雅居中占位 -->
      <view
        v-if="!isOriginLoaded && !thumbUrl"
        class="absolute inset-0 flex flex-col items-center justify-center gap-2 text-tx-brown/40"
      >
        <text class="i-carbon:image text-4xl opacity-50" />
      </view>

      <!-- 方案 B：长图提示（防止核心辨认线索遗漏） -->
      <view
        v-if="isTall"
        class="absolute bottom-2.5 right-2.5 z-10 flex cursor-pointer items-center gap-1 border border-white/20 rounded-full bg-black/50 px-2.5 py-1 text-[11px] text-white/90 font-medium backdrop-blur-md transition-transform active:scale-95"
        @click.stop="emit('preview-image')"
      >
        <text class="i-carbon:fit-to-screen text-xs text-tx-accent" />
        <text>点击查看完整大图</text>
      </view>
    </view>

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
