<template>
  <view class="page-notice safe-bottom-page--fixed-bar">
    <view class="page-notice__header">
      <view>
        <text class="page-notice__title">消息中心</text>
        <text class="page-notice__subtitle">只展示官方提示消息</text>
      </view>
      <view class="notice-search-button u-circle-btn" @tap="goSearch">
        <wd-icon name="search-line" color="#1f1b14" size="30rpx" />
      </view>
    </view>

    <view v-if="searchKeyword" class="notice-search-status">
      <wd-search
        :model-value="searchKeyword"
        custom-class="tx-search"
        disabled
        hide-cancel
        placeholder-left
        placeholder="搜索通知"
        @click="goSearch"
      />
      <view class="notice-search-status__clear" @tap="clearSearch">
        <wd-icon name="close" color="#1f1b14" size="28rpx" />
      </view>
    </view>

    <view v-for="group in visibleNoticeGroups" :key="group.label" class="notice-group">
      <text class="notice-group__label">{{ group.label }}</text>

      <view
        v-for="notice in group.items"
        :key="notice.id"
        class="notice-row"
        @tap="goNoticeDetail(notice)"
      >
        <view class="notice-row__avatar">
          <wd-avatar text="通" size="64rpx" bg-color="#5ec7d3" color="#ffffff" />
        </view>
        <view class="notice-row__main">
          <view class="notice-row__top">
            <text class="notice-row__title">{{ notice.title }}</text>
            <text class="notice-row__time">{{ notice.time }}</text>
          </view>
          <text class="notice-row__summary">{{ notice.summary }}</text>
        </view>
      </view>
    </view>

    <view v-if="!visibleNoticeGroups.length" class="notice-empty">
      <wd-empty icon="no-result" tip="没有找到相关通知" />
    </view>

    <search-overlay
      v-model:visible="searchVisible"
      scope="notice"
      title="搜索通知"
      @search="handleSearch"
    />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { noticeGroups } from '@/features/notice'
import type { NoticeItem } from '@/features/notice'
import { AppRoute, withQuery } from '@/router/routes'

definePage({
  style: {
    navigationBarTitleText: '%page.notice%',
  },
})

const searchVisible = ref(false)
const searchKeyword = ref('')

const visibleNoticeGroups = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()

  return noticeGroups
    .map(group => ({
      ...group,
      items: keyword
        ? group.items.filter(notice =>
            [notice.title, notice.summary, notice.time].some(value =>
              value.toLowerCase().includes(keyword),
            ),
          )
        : group.items,
    }))
    .filter(group => group.items.length > 0)
})

function goSearch() {
  searchVisible.value = true
}

function handleSearch(keyword: string) {
  searchKeyword.value = keyword
}

function clearSearch() {
  searchKeyword.value = ''
}

function goNoticeDetail(notice: NoticeItem) {
  uni.navigateTo({
    url: withQuery(AppRoute.NoticeDetail, { id: notice.id }),
  })
}
</script>

<style scoped lang="scss">
.page-notice {
  padding: 28rpx 30rpx 0;
  background: #ffffff;
}

.page-notice__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
  padding: 12rpx 0 30rpx;
}

.page-notice__title,
.page-notice__subtitle,
.notice-group__label,
.notice-row__title,
.notice-row__time,
.notice-row__summary {
  display: block;
}

.page-notice__title {
  font-size: 42rpx;
  font-weight: 900;
  color: #1f1b14;
}

.page-notice__subtitle {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #9f9f9f;
}

.notice-search-status {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.notice-search-status :deep(.wd-search) {
  flex: 1;
  min-width: 0;
}

.notice-search-status__clear {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 64rpx;
  height: 64rpx;
  background: #ffffff;
  border: 1rpx solid rgba(31, 27, 20, 0.08);
  border-radius: 999rpx;
  box-sizing: border-box;
}

.notice-empty {
  padding: 80rpx 0 120rpx;
}

.notice-group {
  margin-bottom: 34rpx;
}

.notice-group__label {
  margin: 0 0 10rpx 0;
  font-size: 24rpx;
  font-weight: 700;
  color: #8b8b8b;
}

.notice-row {
  display: flex;
  align-items: flex-start;
  gap: 22rpx;
  margin-bottom: 0;
  padding: 22rpx 0 0;
  background: #ffffff;
}

.notice-row__avatar {
  flex-shrink: 0;
}

.notice-row__main {
  flex: 1;
  min-width: 0;
  padding-bottom: 22rpx;
  border-bottom: 1rpx solid #eeeeee;
}

.notice-row:last-child .notice-row__main {
  border-bottom: 0;
}

.notice-row__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.notice-row__title {
  overflow: hidden;
  flex: 1;
  font-size: 32rpx;
  font-weight: 900;
  color: #161616;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notice-row__time {
  flex-shrink: 0;
  font-size: 28rpx;
  color: #777777;
}

.notice-row__summary {
  overflow: hidden;
  margin-top: 10rpx;
  font-size: 28rpx;
  line-height: 1.4;
  color: #7f7f7f;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
