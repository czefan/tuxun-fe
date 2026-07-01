<template>
  <view class="page-notice-detail safe-bottom-page">
    <view class="notice-detail__header">
      <wd-avatar text="官" size="88rpx" :bg-color="BRAND_PRIMARY_COLOR" color="#1f1b14" />
      <view class="notice-detail__title-wrap">
        <text class="notice-detail__eyebrow">官方通知</text>
        <text class="notice-detail__title">{{ title }}</text>
        <text class="notice-detail__time">{{ time }}</text>
      </view>
    </view>

    <view class="notice-detail__content">
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

  if (notice) {
    title.value = notice.title
    time.value = notice.time
  }

  if (detailContent) {
    content.value = detailContent
  }
})
</script>

<style scoped lang="scss">
.page-notice-detail {
  padding: 36rpx 30rpx 0;
  background: #ffffff;
}

.notice-detail__header {
  display: flex;
  gap: 22rpx;
  padding: 0 0 30rpx;
  background: #ffffff;
  border-bottom: 1rpx solid #eeeeee;
}

.notice-detail__title-wrap {
  flex: 1;
  min-width: 0;
}

.notice-detail__eyebrow,
.notice-detail__title,
.notice-detail__time {
  display: block;
}

.notice-detail__eyebrow {
  margin-bottom: 10rpx;
  font-size: 22rpx;
  font-weight: 800;
  letter-spacing: 0;
  color: #b98200;
}

.notice-detail__title {
  font-size: 38rpx;
  font-weight: 900;
  line-height: 1.25;
  color: #1f1b14;
}

.notice-detail__time {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #8b8b8b;
}

.notice-detail__content {
  margin-top: 30rpx;
  padding: 0;
  background: #ffffff;
}
</style>
