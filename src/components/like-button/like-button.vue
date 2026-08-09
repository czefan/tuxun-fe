<script setup lang="ts">
import { computed } from 'vue'
import { formatCompactCount } from '@/utils/format-count'

interface Props {
  liked?: boolean
  count?: number | string
  size?: 'sm' | 'md' | 'lg'
  pill?: boolean
  readonly?: boolean
  activeColor?: string
  color?: string
  iconSize?: string
  fontSize?: string
}

const props = withDefaults(defineProps<Props>(), {
  liked: false,
  size: 'sm',
  pill: false,
  readonly: false,
})

const emit = defineEmits<{
  (e: 'update:liked', val: boolean): void
  (e: 'click'): void
}>()

const iconSize = computed(() => {
  if (props.iconSize)
    return props.iconSize
  if (props.size === 'lg')
    return '42rpx'
  return '28rpx' // sm, md
})

const iconColor = computed(() => {
  if (props.liked) {
    return props.activeColor || (props.size === 'md' ? '#e45064' : '#e54d42')
  }
  if (props.color)
    return props.color
  if (props.size === 'lg')
    return '#222222'
  return '#777777' // sm, md
})

/** 点赞数按设计规范格式化（万/亿 分级），见 @/utils/format-count */
const displayCount = computed(() => {
  if (props.count === undefined || props.count === null)
    return ''
  return formatCompactCount(props.count)
})

const textStyle = computed(() => {
  if (props.liked) {
    return {
      color: props.activeColor || (props.size === 'md' ? '#e45064' : '#e54d42'),
    }
  }
  if (props.size === 'lg')
    return { color: '#333333' }
  if (props.size === 'md')
    return { color: '#666666' }
  return { color: '#777777' }
})

// 早期无乐观更新时，点击后按钮要等 PUT + refetch 两轮往返才有反馈，
// 防抖用来挡住焦虑性重复点击。现在点赞接口幂等、三处 mutation 均有乐观
// 更新，点击瞬间即有反馈；继续保留 1200ms 防抖会吞掉正常的快速取消，
// 表现为「要点好几次才生效」，故移除。
let lastTapTime = 0
function handleTap(_e?: Event) {
  if (props.readonly)
    return
  const now = Date.now()
  if (now - lastTapTime < 250) {
    return
  }
  lastTapTime = now
  emit('update:liked', !props.liked)
  emit('click')
}
</script>

<template>
  <view
    class="inline-flex flex-shrink-0 items-center justify-center transition-all duration-200 ease"
    :class="[
      size === 'lg' ? 'gap-8rpx min-w-120rpx' : 'gap-6rpx',
      pill ? 'px-14rpx py-5rpx bg-[rgba(31,27,20,0.08)] rounded-full' : '',
      readonly ? 'pointer-events-none' : '',
    ]"
    @tap.stop="handleTap"
    @click.stop="handleTap"
  >
    <wd-icon
      :name="liked ? 'heart-fill' : 'heart'"
      :color="iconColor"
      :size="iconSize"
      class="inline-flex items-center justify-center transition-transform duration-150 ease-in-out"
      :class="[liked ? 'scale-118' : '']"
    />
    <text
      v-if="count !== undefined && count !== null"
      class="font-700 leading-none transition-colors duration-200 ease"
      :class="[size === 'lg' ? 'text-28rpx' : 'text-24rpx']"
      :style="[textStyle, fontSize ? { fontSize } : {}]"
    >
      {{ displayCount }}
    </text>
  </view>
</template>
