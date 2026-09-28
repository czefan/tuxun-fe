<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import ProgressiveImage from '@/components/progressive-image/progressive-image.vue'
import ListStateView from '@/components/list-state-view/list-state-view.vue'
import { useAnnouncementDetail } from '@/features/notification/query'
import { useInfiniteActivityList } from '@/features/activity/query'
import { previewImage } from '@/utils/image-preview'

definePage({
  style: {
    navigationBarTitleText: '%page.noticeDetail%',
  },
})

const announcementId = ref(0)
const {
  data: detail,
  isLoading: loading,
  isError,
  refetch,
} = useAnnouncementDetail(() => announcementId.value)
const { data: activityData } = useInfiniteActivityList()

const relatedActivity = computed(() => {
  if (detail.value?.relatedType !== 'activity' || !detail.value?.relatedId) return null
  const allActivities = activityData.value?.pages.flatMap((p) => p.list) || []
  return allActivities.find((a) => a.id === detail.value?.relatedId) || null
})

onLoad((query) => {
  if (typeof query?.id === 'string') {
    announcementId.value = Number(query.id)
  }
})
</script>

<template>
  <view class="page-notice-detail safe-bottom-page box-border bg-tx-main px-4 pt-6">
    <ListStateView
      :loading="loading"
      :error="isError && !detail"
      :empty="!detail"
      empty-tip="未找到相关通知"
      @retry="refetch"
    >
      <!-- 公告详情：版心居中排版 -->
      <view class="mx-auto max-w-xl space-y-3">
        <!-- 标题与时间 / 关联活动 -->
        <view class="border-b border-tx-brown/40 pb-2.5 space-y-2.5">
          <text class="block text-2xl text-tx-ink font-extrabold leading-snug tracking-tight">
            {{ detail?.title }}
          </text>
          <text class="block text-sm text-tx-ink-2 font-medium tracking-wide font-numeric">
            {{ detail?.createdAt }}
          </text>
          <!-- 关联活动标签 -->
          <text v-if="relatedActivity" class="block text-base text-tx-brown font-bold">
            #{{ relatedActivity.title }}
          </text>
        </view>

        <!-- 正文内容：rich-text 渲染 HTML 富文本；容器不带字号/颜色 class，避免 H5 端继承污染内容（小程序端原生组件不继承外部样式） -->
        <view v-if="detail?.content">
          <rich-text :nodes="detail.content" />
        </view>

        <!-- 通知配图 (渐进式展示) -->
        <ProgressiveImage
          v-if="detail?.image?.originUrl"
          :image="detail.image"
          mode="aspectFill"
          custom-class="mt-2 rounded-2xl shadow-xs"
          @click="previewImage(detail.image.originUrl)"
        />
      </view>
    </ListStateView>
  </view>
</template>
