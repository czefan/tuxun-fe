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
  <view class="page-notice-detail safe-bottom-page box-border bg-[#F1DFC5] px-4 pt-6">
    <!-- 公告详情：版心居中排版 -->
    <view v-if="detail" class="mx-auto max-w-xl space-y-3">
      <!-- 标题与时间 / 关联活动 -->
      <view class="border-b border-[#B69171]/40 pb-2.5 space-y-2.5">
        <text class="block text-2xl text-[#1E1E1E] font-extrabold leading-snug tracking-tight">{{ detail.title }}</text>
        <text class="block text-sm text-[#756C5E] font-medium tracking-wide font-numeric">{{ detail.createdAt }}</text>
        <!-- 关联活动标签 -->
        <text v-if="relatedActivity" class="block text-base text-[#B69171] font-bold">#{{ relatedActivity.title }}</text>
      </view>

      <!-- 正文内容：rich-text 渲染 HTML 富文本；容器不带字号/颜色 class，避免 H5 端继承污染内容（小程序端原生组件不继承外部样式） -->
      <view>
        <rich-text :nodes="detail.content" />
      </view>

      <!-- 通知配图 (居中展示) -->
      <view v-if="detail.image?.originUrl" class="w-full flex justify-center pt-2">
        <wd-img
          custom-class="w-full rounded-2xl bg-stone-100 overflow-hidden shadow-xs !block"
          custom-style="display: block; vertical-align: top;"
          :src="detail.image.originUrl"
          lazy-load
          mode="widthFix"
          width="100%"
          @click="previewImage(detail.image.originUrl)"
        />
      </view>
    </view>

    <view v-else-if="!loading" class="py-20">
      <wd-empty icon="no-result" tip="未找到相关通知" />
    </view>
  </view>
</template>
