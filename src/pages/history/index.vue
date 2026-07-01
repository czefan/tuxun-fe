<template>
  <view class="page-history safe-bottom-page--fixed-bar">
    <view class="history-header history-header--list">
      <view>
        <text class="history-header__title">往期</text>
        <text class="history-header__subtitle">活动期刊</text>
      </view>
      <view class="history-search-button u-circle-btn" @tap="goSearch">
        <wd-icon name="search-line" color="#1f1b14" size="30rpx" />
      </view>
    </view>

    <view v-if="searchKeyword" class="history-search-status">
      <wd-search
        :model-value="searchKeyword"
        custom-class="tx-search"
        disabled
        hide-cancel
        placeholder-left
        placeholder="搜索往期活动"
        @click="goSearch"
      />
      <view class="history-search-status__clear" @tap="clearSearch">
        <wd-icon name="close" color="#1f1b14" size="28rpx" />
      </view>
    </view>

    <sort-tabs v-model="sortCurrent" />

    <view class="history-list">
      <view
        v-for="item in visibleActivities"
        :key="item.id"
        class="history-card"
        @tap="goActivity(item)"
      >
        <view class="history-card__cover" :style="{ background: item.coverTone }">
          <image
            class="history-card__image"
            :src="item.cover"
            lazy-load
            mode="aspectFill"
          />
        </view>

        <view class="history-card__main">
          <view class="history-card__top">
            <text class="history-card__title">{{ item.title }}</text>
            <text class="history-card__time">{{ item.period }}</text>
          </view>
          <text class="history-card__desc">{{ item.desc }}</text>
          <view class="history-card__meta">
            <text class="history-card__meta-text">{{ item.count }} 题</text>
            <text class="history-card__dot">·</text>
            <text class="history-card__meta-text">{{ item.heatLabel }} 热度</text>
          </view>
        </view>
      </view>
    </view>

    <search-overlay
      v-model:visible="searchVisible"
      scope="history"
      title="搜索往期活动"
      @search="handleSearch"
    />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { AppRoute, withQuery } from '@/router/routes'
import { pastActivityList } from '@/features/history'
import type { PastActivity } from '@/features/history'

definePage({
  style: {
    navigationBarTitleText: '%page.history%',
  },
})

type SortType = 'hot' | 'latest'

const sortCurrent = ref(0)
const searchVisible = ref(false)
const searchKeyword = ref('')

const sortType = computed<SortType>(() => (sortCurrent.value === 0 ? 'hot' : 'latest'))

const visibleActivities = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  const filtered = keyword
    ? pastActivityList.filter(item =>
        [item.title, item.period, item.desc, item.heatLabel].some(value =>
          value.toLowerCase().includes(keyword),
        ),
      )
    : [...pastActivityList]

  return filtered.sort((a, b) =>
    sortType.value === 'latest' ? b.createdAt - a.createdAt : b.heat - a.heat,
  )
})

function goActivity(item: PastActivity) {
  uni.navigateTo({
    url: withQuery(AppRoute.Activity, { id: item.id }),
  })
}

function goSearch() {
  searchVisible.value = true
}

function handleSearch(keyword: string) {
  searchKeyword.value = keyword
}

function clearSearch() {
  searchKeyword.value = ''
}
</script>

<style scoped lang="scss">
.page-history {
  padding: 0 22rpx 0;
  background: #f6f4ef;
}

.history-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
  padding: 10rpx 6rpx 22rpx;
}

.history-header--list {
  padding-top: 30rpx;
}

.history-header__title,
.history-header__subtitle,
.history-card__image,
.history-card__title,
.history-card__time,
.history-card__desc,
.history-card__meta-text,
.history-card__dot {
  display: block;
}

.history-header__title {
  overflow: hidden;
  font-size: 46rpx;
  font-weight: 900;
  line-height: 1.12;
  color: #1f1b14;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-search-status {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin: 0 4rpx 18rpx;
}

.history-search-status :deep(.wd-search) {
  flex: 1;
  min-width: 0;
}

.history-search-status__clear {
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

.history-header__subtitle {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #81786c;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.history-card {
  display: flex;
  align-items: stretch;
  gap: 22rpx;
  padding: 0 14rpx 0 0;
  background: #ffffff;
  border-radius: 12rpx;
  box-shadow: 0 10rpx 28rpx rgba(31, 26, 18, 0.06);
}

.history-card__cover {
  position: relative;
  display: flex;
  flex-shrink: 0;
  width: 270rpx;
  height: 220rpx;
  overflow: hidden;
  border-radius: 12rpx 0 0 12rpx;
}

.history-card__image {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.history-card__main {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
  padding: 14rpx 0;
}

.history-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10rpx;
}

.history-card__title {
  display: -webkit-box;
  overflow: hidden;
  flex: 1;
  font-size: 31rpx;
  font-weight: 900;
  line-height: 1.34;
  color: #1f1b14;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.history-card__time {
  flex-shrink: 0;
  padding-top: 4rpx;
  font-size: 22rpx;
  font-weight: 800;
  color: #9a9287;
}

.history-card__desc {
  display: -webkit-box;
  overflow: hidden;
  margin-top: 10rpx;
  font-size: 24rpx;
  line-height: 1.42;
  color: #746b60;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.history-card__meta {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 16rpx;
}

.history-card__meta-text,
.history-card__dot {
  font-size: 22rpx;
  font-weight: 800;
  color: #b98200;
}
</style>
