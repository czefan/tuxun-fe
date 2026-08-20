<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PhotoCardVM } from '../types'
import { useSetPhotoLike } from '../query'
import { useAuth } from '@/composables/use-auth'

const props = defineProps<{
  item: PhotoCardVM
  opening?: boolean
}>()

defineEmits<{
  (event: 'open', item: PhotoCardVM): void
}>()

const { requireLogin, isMe } = useAuth()
const { mutate: setLike } = useSetPhotoLike()

const loadedRatio = ref<number | null>(null)

// 瀑布流单列宽度约为 345rpx，根据图片宽高比例计算精确 rpx 高度，保证 wd-img 在跨端均能稳定渲染
const displayHeight = computed(() => {
  if (loadedRatio.value) {
    return `${Math.round(345 * loadedRatio.value)}rpx`
  }
  if (props.item.image && props.item.image.width > 0 && props.item.image.height > 0) {
    const ratio = props.item.image.height / props.item.image.width
    // 防御性限幅：比例介于 0.5 (横图) 到 1.6 (竖图) 之间，避免极畸形图破坏瀑布流结构
    const clamped = Math.min(Math.max(ratio, 0.5), 1.6)
    return `${Math.round(345 * clamped)}rpx`
  }
  return '260rpx'
})

function onImageLoad(e: any) {
  const { width, height } = e.detail || {}
  if (width && height) {
    loadedRatio.value = height / width
  }
}

function handleLikeTap(e?: Event) {
  e?.stopPropagation?.()
  if (!requireLogin()) {
    return
  }
  setLike({ id: props.item.id, liked: !props.item.liked })
}
</script>

<template>
  <view
    :id="`photo-card-${item.id}`"
    class="photo-card relative mb-1.5 box-border cursor-pointer"
    @tap="$emit('open', item)"
  >
    <!-- 相纸展示结构（图片与卡片边界直接重合，零四周留白，Subtle 8px 圆角） -->
    <view class="shadow-2xs overflow-hidden border border-tx-border/60 rounded-lg bg-white">
      <view class="relative w-full overflow-hidden">
        <wd-img
          custom-class="w-full block transition-transform duration-500 hover:scale-105"
          :style="opening ? { 'view-transition-name': `photo-cover-${item.id}` } : undefined"
          lazy-load
          :src="item.image.url"
          mode="aspectFill"
          width="100%"
          :height="displayHeight"
          @load="onImageLoad"
        />

        <!-- 题目右上角已破解大图标 Badge (24px 绿色图标遮盖 16px 白色衬底，仅中间对勾填充纯白，外圈不露白) -->
        <view
          v-if="item.solved"
          class="pointer-events-none absolute right-2 top-2 z-1 h-6 w-6 flex items-center justify-center"
        >
          <view class="absolute h-4 w-4 rounded-full bg-white" />
          <wd-icon name="check-circle-fill" size="24px" color="#34D399" custom-class="relative z-1 !leading-none block drop-shadow-2xs" />
        </view>
      </view>

      <!-- 题目描述与作者信息区 -->
      <view class="px-2.5 pb-3 pt-2 space-y-2">
        <view class="u-title-card">
          {{ item.title }}
        </view>

        <view class="flex items-center justify-between">
          <view class="mr-1 min-w-0 flex flex-1 items-center gap-1">
            <wd-img
              custom-class="w-5 h-5 rounded-full flex-shrink-0 ring-1 ring-tx-border/40"
              lazy-load
              :src="item.author.avatar || '/static/images/default-avatar.png'"
              mode="aspectFill"
              round
              width="40rpx"
              height="40rpx"
            />
            <view class="min-w-0 flex items-center">
              <text class="truncate text-xs text-tx-ink-2 font-medium">
                {{ item.author.nickname }}
              </text>
              <text v-if="isMe(item.author.id)" class="ml-1 flex-shrink-0 rounded bg-tx-brown/15 px-1 py-0.2 text-[10px] text-tx-brown font-bold leading-none">我</text>
            </view>
          </view>
          <like-button :liked="item.liked" :count="item.likesCount" @click="handleLikeTap" />
        </view>
      </view>
    </view>
  </view>
</template>
