<!--
  注意：@uni-ku/root 让 App.ku.vue 包裹每一个页面，本组件因此是「每页一份」而非全局单例。
  往这里加东西前先想清楚：它应该每页都有（如登录弹窗），还是全站只该有一个（如公告弹窗）？
  后者必须自行做作用域限定与去重，见 announcement-popup.vue。
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { isTabBarPage } from '@/app/tab-bar/store'
import NetworkBar from '@/components/network-bar/network-bar.vue'
import LoginConfirmModal from '@/features/user/components/login-confirm-modal/login-confirm-modal.vue'
import { currRoute } from '@/router/page'
import { useAuthStore } from '@/store/auth'
import AnnouncementPopup from '../announcement-popup/announcement-popup.vue'

const authStore = useAuthStore()

// 与 App.ku.vue 保持同一套判断：线上 H5 根路径 '/' 由 normalizeRoutePath 统一处理
const showAnnouncement = ref(false)
onShow(() => {
  const { path } = currRoute()
  showAnnouncement.value = isTabBarPage(path)
})

const showLoginModal = computed({
  get: () => authStore.showLoginModal,
  set: (val: boolean) => {
    if (val) {
      authStore.openLoginModal()
    }
    else {
      authStore.closeLoginModal()
    }
  },
})
</script>

<template>
  <view class="app-global-provider">
    <!-- 断网提示：全站每页都要有，不能只挂在底栏上 -->
    <NetworkBar />
    <!-- 公告弹窗：仅在 tabBar 页渲染 -->
    <announcement-popup v-if="showAnnouncement" />
    <!-- 登录/调试确认弹窗 -->
    <login-confirm-modal v-model="showLoginModal" />
  </view>
</template>
