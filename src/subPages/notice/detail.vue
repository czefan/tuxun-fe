<template>
  <view class="page-notice-detail safe-bottom-page bg-white p-30rpx pt-36rpx">
    <view class="flex gap-22rpx border-0 border-b border-[#eeeeee] border-solid bg-white pb-30rpx">
      <wd-avatar text="官" size="88rpx" :bg-color="BRAND_PRIMARY_COLOR" color="#1f1b14" />
      <view class="min-w-0 flex-1">
        <text class="mb-10rpx block text-22rpx text-[#b98200] font-800 tracking-0">官方通知</text>
        <text class="block text-38rpx text-[#1f1b14] font-900 leading-[1.25]">{{ title }}</text>
        <text class="mt-12rpx block text-24rpx text-[#8b8b8b]">{{ time }}</text>
      </view>
    </view>

    <view class="mt-30rpx bg-white p-0">
      <text class="u-paragraph">{{ content }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getNoticeById } from '@/features/notice'
import { getNoticeDetailContentById } from './features'
import { BRAND_PRIMARY_COLOR } from '@/styles/constants'

definePage({
  style: {
    navigationBarTitleText: '%page.noticeDetail%',
  },
})

const title = ref('消息详情')
const time = ref('')
const content = ref('暂无详情内容。')

onLoad((query) => {
  const rawId = Number(query?.id)
  const notice = Number.isFinite(rawId) ? getNoticeById(rawId) : undefined
  const detailContent = Number.isFinite(rawId) ? getNoticeDetailContentById(rawId) : ''

  if (Number.isFinite(rawId)) {
    try {
      const ids = uni.getStorageSync('tuxun_read_notices')
      const readNoticeIds = Array.isArray(ids) ? ids : []
      if (!readNoticeIds.includes(rawId)) {
        readNoticeIds.push(rawId)
        uni.setStorageSync('tuxun_read_notices', readNoticeIds)
      }
    }
    catch (e) {
      // ignore
    }
  }

  if (notice) {
    title.value = notice.title
    time.value = notice.time
  }

  if (detailContent) {
    content.value = detailContent
  }
})
</script>
