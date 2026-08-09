import { onMounted, onUnmounted, ref } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'

export function useNetworkStatus() {
  const isOffline = ref(false)
  const queryClient = useQueryClient()

  function checkStatus() {
    uni.getNetworkType({
      success: (res) => {
        isOffline.value = res.networkType === 'none'
      },
    })
  }

  function handleNetworkChange(res: { isConnected: boolean, networkType: string }) {
    const offline = !res.isConnected || res.networkType === 'none'
    if (isOffline.value && !offline) {
      // 网络恢复，重新自动重拉 Vue Query 数据
      queryClient.invalidateQueries()
    }
    isOffline.value = offline
  }

  onMounted(() => {
    checkStatus()
    uni.onNetworkStatusChange(handleNetworkChange)
  })

  onUnmounted(() => {
    uni.offNetworkStatusChange(handleNetworkChange)
  })

  return {
    isOffline,
  }
}
