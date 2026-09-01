<script setup lang="ts">
import { computed } from 'vue'
import { TX_BG_BROWN } from '@/styles/constants'

interface Props {
  needsLogin?: boolean
  loading?: boolean
  error?: boolean
  empty?: boolean
  loginTip?: string
  errorTip?: string
  emptyTip?: string
  loadingVariant?: 'spinner' | 'skeleton'
  loadingSize?: string
  centerClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  needsLogin: false,
  loading: false,
  error: false,
  empty: false,
  loginTip: '请登录后查看',
  errorTip: '加载失败，请检查网络后重试',
  emptyTip: '暂无数据',
  loadingVariant: 'spinner',
  loadingSize: '36px',
  centerClass: '',
})

const emit = defineEmits<{
  (e: 'login'): void
  (e: 'retry'): void
}>()

const defaultCenterClass = 'h-full min-h-[65vh] flex flex-col items-center justify-center -mt-8'

const baseClass = computed(() => props.centerClass || defaultCenterClass)
const errorClass = computed(() => `${baseClass.value} gap-3`)
</script>

<template>
  <!-- 1. 未登录态 -->
  <view v-if="needsLogin" :class="baseClass">
    <slot name="login">
      <wd-empty icon="no-result" :tip="loginTip" />
      <wd-button
        size="small"
        round
        type="warning"
        custom-class="!mt-4 !font-bold shadow-md"
        @click="emit('login')"
      >
        去登录
      </wd-button>
    </slot>
  </view>

  <!-- 2. 加载态 -->
  <template v-else-if="loading">
    <slot v-if="loadingVariant === 'skeleton'" name="loading" />
    <view v-else :class="baseClass">
      <wd-loading type="circular" :color="TX_BG_BROWN" :size="loadingSize" />
    </view>
  </template>

  <!-- 3. 失败态 -->
  <view v-else-if="error" :class="errorClass">
    <slot name="error">
      <wd-empty icon="network-error" :tip="errorTip" />
      <wd-button size="small" plain round @click="emit('retry')"> 重新加载 </wd-button>
    </slot>
  </view>

  <!-- 4. 空态 -->
  <view v-else-if="empty" :class="baseClass">
    <slot name="empty">
      <wd-empty icon="no-result" :tip="emptyTip" />
    </slot>
  </view>

  <!-- 5. 正常列表插槽 -->
  <slot v-else />
</template>
