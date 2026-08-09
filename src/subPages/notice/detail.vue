<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useAnnouncementDetail } from '@/features/notification/query'
import { previewImage } from '@/utils/image-preview'

definePage({
  style: {
    navigationBarTitleText: '%page.noticeDetail%',
  },
})

const announcementId = ref(0)
const { data: detail, isLoading: loading } = useAnnouncementDetail(() => announcementId.value)

onLoad((query) => {
  if (typeof query?.id === 'string') {
    announcementId.value = Number(query.id)
  }
})
</script>

<template>
  <view class="page-notice-detail safe-bottom-page box-border bg-[#F1DFC5] px-4 pt-6">
    <!-- 公告详情：版心居中排版 -->
    <view v-if="detail" class="mx-auto max-w-xl space-y-5">
      <!-- 标题与时间 -->
      <view class="border-b border-[#B69171]/40 pb-4 space-y-2">
        <text class="block text-2xl text-[#1E1E1E] font-extrabold leading-snug tracking-tight">{{ detail.title }}</text>
        <text class="block text-sm text-[#756C5E] font-medium tracking-wide font-numeric">{{ detail.createdAt }}</text>
      </view>

      <!-- 升级字号的正文内容 -->
      <view class="text-base text-[#26221F] leading-relaxed tracking-normal">
        <text class="block whitespace-pre-wrap leading-relaxed">{{ detail.content }}</text>
      </view>

      <!-- 通知配图 (居中展示) -->
      <view v-if="detail.image?.originUrl" class="w-full flex justify-center pt-2">
        <wd-img
          custom-class="w-full rounded-2xl bg-stone-100 overflow-hidden shadow-xs"
          :src="detail.image.originUrl"
          lazy-load
          mode="widthFix"
          width="100%"
          :style="{ aspectRatio: `${detail.image.width} / ${detail.image.height}` }"
          @click="previewImage(detail.image.originUrl)"
        />
      </view>
    </view>

    <view v-else-if="!loading" class="py-20">
      <wd-empty icon="no-result" tip="未找到相关通知" />
    </view>
  </view>
</template>
