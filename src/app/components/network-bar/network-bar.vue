<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import { onlineManager } from '@tanstack/vue-query'

const isOffline = ref(!onlineManager.isOnline())
const unsubscribe = onlineManager.subscribe((online) => {
  isOffline.value = !online
})
onUnmounted(unsubscribe)
</script>

<template>
  <view
    v-if="isOffline"
    class="fixed left-0 right-0 top-0 z-[9999] flex items-center justify-center gap-2 border-b border-tx-border bg-tx-accent px-4 py-2 text-xs text-[#81786c] font-bold shadow-md"
  >
    <text class="i-carbon-warning-alt text-base text-amber-700 font-bold" />
    <text>当前网络已断开，重新连接后将自动拉取数据</text>
  </view>
</template>
