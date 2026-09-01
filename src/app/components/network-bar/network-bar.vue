<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'

const isOffline = ref(false)
const queryClient = useQueryClient()

function handleNetworkChange(res: { isConnected: boolean; networkType: string }) {
  const offline = !res.isConnected || res.networkType === 'none'
  // 网络恢复时重拉数据：断网期间失败的查询不会自己重试
  if (isOffline.value && !offline) {
    queryClient.invalidateQueries()
  }
  isOffline.value = offline
}

onMounted(() => {
  uni.getNetworkType({
    success: (res) => {
      isOffline.value = res.networkType === 'none'
    },
  })
  uni.onNetworkStatusChange(handleNetworkChange)
})

onUnmounted(() => {
  uni.offNetworkStatusChange(handleNetworkChange)
})
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
