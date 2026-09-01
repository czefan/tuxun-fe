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
onShow(() => {
  logAppLifecycle('onShow')
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
  // 在浏览器空闲时静默预拉取 4 个同等地位的主 Tab 页面组件：
  // 无论用户首次从「首页」、「活动」、「通知」还是「我的」进入，当前页面直接读取，其余 Tab 均在闲时预入内存
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      // 预取失败无需处理：主 Tab 真正被访问时会正常按需加载
      const swallow = () => {}
      import('@/pages/index/index.vue').catch(swallow)
      import('@/pages/activity/index.vue').catch(swallow)
      import('@/pages/notice/index.vue').catch(swallow)
      import('@/pages/my/index.vue').catch(swallow)
    })
  }
})

onUnmounted(() => {
  uninstallImagePreviewBackGuard()
})
// #endif
</script>

<style>
@import '@/styles/index.css';
</style>
