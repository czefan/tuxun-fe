<template>
  <view
    class="like-button"
    :class="[
      `like-button--${size}`,
      {
        'like-button--pill': pill,
        'like-button--active': liked && !readonly,
        'like-button--readonly': readonly,
      },
    ]"
    @tap.stop="handleTap"
  >
    <wd-icon
      :name="liked ? 'heart-fill' : 'heart'"
      :color="iconColor"
      :size="iconSize"
      class="like-button__icon"
      :class="{ 'like-button__icon--active': liked }"
    />
    <text
      v-if="count !== undefined && count !== null"
      class="like-button__text"
      :class="{ 'like-button__text--active': liked }"
      :style="[textStyle, fontSize ? { fontSize } : {}]"
    >
      {{ count }}
    </text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

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

function handleTap() {
  if (props.readonly)
    return
  emit('update:liked', !props.liked)
  emit('click')
}
</script>

<style lang="scss">
@import './like-button.scss';
</style>
