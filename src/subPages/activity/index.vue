<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import PhotoFeed from '@/features/photo/components/photo-feed.vue'

definePage({
  style: {
    navigationBarTitleText: '%page.activity%',
    enablePullDownRefresh: true,
  },
})

const activityId = ref(0)
onLoad((options) => {
  const id = Number(options?.id)
  activityId.value = Number.isSafeInteger(id) && id > 0 ? id : 0
  let title = options?.title || '活动主页'
  try {
    title = decodeURIComponent(title)
  } catch {
    // 非法转义不应阻断整个页面渲染。
  }
  uni.setNavigationBarTitle({ title })
})
</script>

<template>
  <PhotoFeed v-if="activityId" :activity-id="activityId" />
  <view v-else class="p-8 text-center text-tx-ink-2">未找到相关活动</view>
</template>
