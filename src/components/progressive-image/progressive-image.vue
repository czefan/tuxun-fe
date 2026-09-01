<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ImageVM } from '@/service/contract/types'

interface Props {
  image?: ImageVM | null
  thumbUrl?: string | null
  mode?:
    | 'scaleToFill'
    | 'aspectFit'
    | 'aspectFill'
    | 'widthFix'
    | 'top'
    | 'bottom'
    | 'center'
    | 'left'
    | 'right'
    | 'top left'
    | 'top right'
    | 'bottom left'
    | 'bottom right'
  maxHeight?: string
  customClass?: string
  viewTransitionName?: string
}

defineOptions({
  options: {
    virtualHost: true,
  },
})

const props = withDefaults(defineProps<Props>(), {
  image: () => ({ url: '', originUrl: '', width: 800, height: 600 }),
  thumbUrl: null,
  mode: 'aspectFit',
  maxHeight: undefined,
  customClass: '',
  viewTransitionName: undefined,
})

const emit = defineEmits<{
  (e: 'click'): void
}>()

const isOriginLoaded = ref(false)

watch(
  () => [props.image?.originUrl, props.image?.url],
  () => {
    isOriginLoaded.value = false
  },
)

/**
 * 严格守卫：
 * 仅当存在缩略图且缩略图与原图不是同一个 URL 时才开启缩略图占位层，
 * 避免无 thumb_url 时同图下载两次（纯亏）。
 */
const effectiveThumbUrl = computed(() => {
  const candidate = props.thumbUrl ?? props.image?.url
  if (candidate && props.image?.originUrl && candidate !== props.image.originUrl) {
    return candidate
  }
  return null
})

const aspectRatioStyle = computed(() => {
  const w = props.image?.width
  const h = props.image?.height
  if (w && h && w > 0 && h > 0) {
    return `${w} / ${h}`
  }
  return '4 / 3'
})
</script>

<template>
  <view
    class="relative w-full overflow-hidden bg-tx-brown/10"
    :class="customClass"
    :style="{
      aspectRatio: aspectRatioStyle,
      maxHeight,
    }"
  >
    <!-- 1. 底层：缩略图常驻垫底（秒出，原图加载时绝不卸载，杜绝闪烁） -->
    <image
      v-if="effectiveThumbUrl"
      class="absolute inset-0 block h-full w-full cursor-pointer"
      :src="effectiveThumbUrl"
      :mode="mode"
      @click="emit('click')"
    />

    <!-- 2. 顶层：高清原图层（加载完毕瞬间直接覆盖显示，瞬时清晰无等待动画） -->
    <image
      v-if="image?.originUrl"
      class="block h-full w-full cursor-pointer"
      :class="[
        isOriginLoaded || !effectiveThumbUrl ? 'opacity-100' : 'opacity-0 pointer-events-none',
        effectiveThumbUrl ? 'absolute inset-0' : '',
      ]"
      :style="viewTransitionName ? { 'view-transition-name': viewTransitionName } : undefined"
      :src="image.originUrl"
      :mode="mode"
      @load="isOriginLoaded = true"
      @click="emit('click')"
    />

    <!-- 3. 未就绪且无缩略图时的全局优雅居中占位图标 -->
    <view
      v-if="!isOriginLoaded && !effectiveThumbUrl"
      class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-tx-brown/40"
    >
      <text class="i-carbon-image text-4xl opacity-50" />
    </view>

    <!-- 默认插槽：供父组件覆盖悬浮胶囊、角标、操作按钮等 -->
    <slot />
  </view>
</template>
