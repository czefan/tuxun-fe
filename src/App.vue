<script setup lang="ts">
import { onHide, onLaunch, onShow } from '@dcloudio/uni-app'
import { onMounted, onUnmounted } from 'vue'
import { navigateToInterceptor } from '@/router/guard'
import { tabbarStore } from '@/tabbar/store'
import { installImagePreviewBackGuard, uninstallImagePreviewBackGuard } from '@/utils/imagePreview'

// 挂载业务生命周期与 H5 共享元素转场 overlay
import { useAppLifecycle } from '@/composables/useAppLifecycle'
import { useQuestionTransitionOverlay } from '@/features/question-transition'

// #ifdef MP-WEIXIN
import { installWechatUpdateManager } from '@/utils/updateManager.wx'
// #endif

onLaunch((options) => {
  console.log('App.vue onLaunch', options)
  // #ifdef MP-WEIXIN
  installWechatUpdateManager()
  // #endif
})
onShow((options) => {
  console.log('App.vue onShow', options)
  // 处理直接进入页面路由的情况：如h5直接输入路由、微信小程序分享后进入等
  // https://github.com/unibest-tech/unibest/issues/192
  if (options?.path) {
    navigateToInterceptor.invoke({ url: `/${options.path}`, query: options.query })
  }
  else {
    navigateToInterceptor.invoke({ url: '/' })
  }
})
onHide(() => {
  console.log('App Hide')
})

useAppLifecycle()
useQuestionTransitionOverlay()

// #ifdef H5
function syncTabbarWhenPageVisible() {
  if (document.visibilityState === 'visible') {
    tabbarStore.syncCurIdxByCurrentPageAsync()
  }
}

onMounted(() => {
  installImagePreviewBackGuard()
  document.addEventListener('visibilitychange', syncTabbarWhenPageVisible)
  window.addEventListener('pageshow', syncTabbarWhenPageVisible)
})

onUnmounted(() => {
  uninstallImagePreviewBackGuard()
  document.removeEventListener('visibilitychange', syncTabbarWhenPageVisible)
  window.removeEventListener('pageshow', syncTabbarWhenPageVisible)
})
// #endif
</script>

<style lang="scss">
@import '@/styles/common.scss';
@import '@/styles/layout.scss';
@import '@/styles/form.scss';
@import '@/features/question-transition/overlay.scss';
</style>
