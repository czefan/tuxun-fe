<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useAnnouncementDetail } from '@/features/notification/query'
import { useInfiniteActivityList } from '@/features/activity/query'
import { previewImage } from '@/utils/image-preview'

definePage({
  style: {
    navigationBarTitleText: '%page.noticeDetail%',
  },
})

const announcementId = ref(0)
const { data: detail, isLoading: loading } = useAnnouncementDetail(() => announcementId.value)
const { data: activityData } = useInfiniteActivityList()

const relatedActivity = computed(() => {
  if (detail.value?.relatedType !== 'activity' || !detail.value?.relatedId)
    return null
  const allActivities = activityData.value?.pages.flatMap(p => p.list) || []
  return allActivities.find(a => a.id === detail.value?.relatedId) || null
})

onLoad((query) => {
  if (typeof query?.id === 'string') {
    announcementId.value = Number(query.id)
  }
})
</script>

<template>
  <view class="page-notice-detail safe-bottom-page box-border bg-tx-main px-4 pt-6">
    <!-- 公告详情：版心居中排版 -->
    <view v-if="detail" class="mx-auto max-w-xl space-y-3">
      <!-- 标题与时间 / 关联活动 -->
      <view class="border-b border-tx-brown/40 pb-2.5 space-y-2.5">
        <text class="block text-2xl text-tx-ink font-extrabold leading-snug tracking-tight">{{ detail.title }}</text>
        <text class="block text-sm text-tx-ink-2 font-medium tracking-wide font-numeric">{{ detail.createdAt }}</text>
        <!-- 关联活动标签 -->
        <text v-if="relatedActivity" class="block text-base text-tx-brown font-bold">#{{ relatedActivity.title }}</text>
      </view>

      <!-- 正文内容：rich-text 渲染 HTML 富文本；容器不带字号/颜色 class，避免 H5 端继承污染内容（小程序端原生组件不继承外部样式） -->
      <view>
        <rich-text :nodes="detail.content" />
      </view>

      <!-- 通知配图 (居中展示) -->
      <view
        v-if="detail.image?.originUrl || detail.image?.url"
        class="relative mt-2 w-full flex overflow-hidden rounded-2xl bg-tx-brown/10"
        :style="detail.image?.width && detail.image?.height ? { aspectRatio: `${detail.image.width} / ${detail.image.height}` } : {}"
      >
        <wd-img
          custom-class="shadow-xs !block w-full cursor-pointer"
          :custom-style="`display: block; vertical-align: top; width: 100%;${detail.image?.width && detail.image?.height ? ` aspect-ratio: ${detail.image.width} / ${detail.image.height};` : ''}`"
          :src="detail.image.originUrl || detail.image.url"
          lazy-load
          mode="widthFix"
          width="100%"
          @click="previewImage(detail.image.originUrl || detail.image.url)"
        />
      </view>
    </view>

    <view v-else-if="!loading" class="py-20">
      <wd-empty icon="no-result" tip="未找到相关通知" />
    </view>
  </view>
</template>
