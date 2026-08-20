<script setup lang="ts">
import { onHide, onLaunch, onShow } from '@dcloudio/uni-app'
import { onMounted, onUnmounted } from 'vue'
import { installImagePreviewBackGuard, uninstallImagePreviewBackGuard } from '@/utils/image-preview'
import { useAppLifecycle } from '@/app/lifecycle/use-app-lifecycle'

// #ifdef MP-WEIXIN
import { installWechatUpdateManager } from '@/utils/update-manager.wx'
// #endif

onLaunch((options) => {
  logAppLifecycle('onLaunch', options)
  // #ifdef MP-WEIXIN
  installWechatUpdateManager()
  // #endif
})
onShow((options) => {
  logAppLifecycle('onShow', options)
})
onHide(() => {
  logAppLifecycle('onHide')
})

useAppLifecycle()

function logAppLifecycle(name: string, payload?: unknown) {
  if (import.meta.env.DEV) {
    console.log(`App.vue ${name}`, payload)
  }
}

// #ifdef H5
onMounted(() => {
  installImagePreviewBackGuard()
})

onUnmounted(() => {
  uninstallImagePreviewBackGuard()
})
// #endif
</script>

<style lang="scss">
@import '@/styles/index.scss';
</style>
