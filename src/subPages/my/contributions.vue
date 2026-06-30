<template>
  <view class="page-contributions safe-bottom-page">
    <view class="contributions-header">
      <view class="contributions-header__main">
        <text class="contributions-header__title">{{ t('page.contributions') }}</text>
        <text class="contributions-header__subtitle">{{ t('page.contributions.subtitle') }}</text>
      </view>
      <view class="contributions-search-button u-circle-btn" @tap="goSearch">
        <wd-icon name="search-line" color="#1f1b14" size="30rpx" />
      </view>
    </view>

    <view v-if="searchKeyword" class="contributions-search-status">
      <wd-search
        :model-value="searchKeyword"
        hide-cancel
        custom-class="tx-search"
        placeholder-left
        disabled
        @click="goSearch"
      />
      <view class="contributions-search-status__clear" @tap="clearSearch">
        <wd-icon name="close" color="#1f1b14" size="28rpx" />
      </view>
    </view>

    <!-- 横向 Tabs 过滤栏 -->
    <sliding-tabs
      :list="tabs"
      :model-value="activeTab"
      padding="8rpx 24rpx 28rpx"
      @change="onTabChange"
    />

    <!-- 左右滑动分页 Swiper -->
    <swiper
      class="contributions-swiper"
      :current="currentTab"
      @change="onSwiperChange"
    >
      <swiper-item v-for="tab in tabs" :key="tab.key">
        <scroll-view scroll-y class="swiper-scroll">
          <view class="contribution-list">
            <view
              v-for="item in getFilteredContributionsByStatus(tab.key)"
              :key="item.id"
              class="contribution-card"
            >
              <view class="contribution-card__content">
                <image
                  class="contribution-card__cover"
                  :src="item.cover"
                  mode="aspectFill"
                />
                <view class="contribution-card__main">
                  <text class="contribution-card__title">{{ item.title }}</text>
                  <view class="contribution-card__bottom">
                    <status-tag :status="item.status" />
                    <text class="contribution-card__time">{{ item.time }}</text>
                  </view>
                </view>
              </view>

              <!-- 反馈原因整栏展开提示条 -->
              <view v-if="item.status === 'rejected' && item.reason" class="contribution-card__reason-box">
                <text class="contribution-card__reason-text">反馈：{{ item.reason }}</text>
              </view>
            </view>

            <!-- 缺省状态 -->
            <view v-if="!getFilteredContributionsByStatus(tab.key).length" class="contributions-empty">
              <wd-empty icon="no-content" :tip="contributionsEmptyText" />
            </view>
          </view>
        </scroll-view>
      </swiper-item>
    </swiper>

    <!-- 复用全局的搜索浮层，直接传递搜索项实现纯前端精准搜索 -->
    <search-overlay
      v-model:visible="searchVisible"
      :results="searchResults"
      :title="t('search.title.contributions')"
      @search="handleSearch"
    />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {

  getContributionRecords,
} from './features'
import type { ContributionStatus } from './features'
import { usePrivateList } from '@/composables/usePrivateList'
import { t } from '@/locale'

definePage({
  style: {
    navigationBarTitleText: '%page.contributions%',
  },
})

type TabKey = 'all' | ContributionStatus

interface TabItem {
  key: TabKey
  title: string
}

const searchVisible = ref(false)
const searchKeyword = ref('')
const activeTab = ref<TabKey>('all')
const currentTab = ref(0)

const tabs: TabItem[] = [
  { key: 'all', title: t('common.all') },
  { key: 'pending', title: t('status.pending') },
  { key: 'approved', title: t('status.approved') },
  { key: 'rejected', title: t('status.rejected') },
]

const statusText: Record<ContributionStatus, string> = {
  pending: t('status.pending'),
  approved: t('status.approved'),
  rejected: t('status.rejected'),
}

const { list: contributions, emptyText: contributionsEmptyText } = usePrivateList(
  getContributionRecords,
  t('empty.contributions'),
)

function onTabChange(key: string, index: number) {
  const tab = tabs[index]

  if (!tab) {
    return
  }

  currentTab.value = index
  activeTab.value = tab.key
}

function onSwiperChange(e: any) {
  const index = e.detail.current
  onTabChange('', index)
}

function getFilteredContributionsByStatus(status: TabKey) {
  const statusFiltered
    = status === 'all'
      ? contributions.value
      : contributions.value.filter(item => item.status === status)
  const keyword = searchKeyword.value.trim().toLowerCase()

  if (!keyword) {
    return statusFiltered
  }

  return statusFiltered.filter(item =>
    [
      item.title,
      item.description,
      item.location,
      item.time,
      statusText[item.status],
      item.reason ?? '',
    ].some(value => value.toLowerCase().includes(keyword)),
  )
}

// 构造通用的 SearchResult 传给 search-overlay 实现无缝搜索
const searchResults = computed(() => {
  return contributions.value.map(record => ({
    id: `contribution-${record.id}`,
    title: record.title,
    desc: record.description,
    meta: statusText[record.status],
  }))
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
</script>

<style scoped lang="scss">
.page-contributions {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding-top: 34rpx;
  background: #f6f4ef;
  box-sizing: border-box;
}

.contributions-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
  padding: 4rpx 24rpx 28rpx;
}

.contributions-header__main {
  flex: 1;
  min-width: 0;
}

.contributions-header__title,
.contributions-header__subtitle,
.contribution-card__title,
.contribution-card__time,
.contribution-card__reason-text {
  display: block;
}

.contributions-header__title {
  font-size: 44rpx;
  font-weight: 900;
  line-height: 1.15;
  color: #1f1b14;
}

.contributions-header__subtitle {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #81786c;
}

.contributions-search-status {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 0 24rpx 18rpx;
}

.contributions-search-status :deep(.wd-search) {
  flex: 1;
  min-width: 0;
}

.contributions-search-status__clear {
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

/* Swiper 滑动层满高自适应 */
.contributions-swiper {
  flex: 1;
  min-height: 0;
  width: 100%;
}

.swiper-scroll {
  height: 100%;
}

.contribution-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  padding: 16rpx 24rpx calc(48rpx + env(safe-area-inset-bottom));
}

.contribution-card {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding: 18rpx;
  background: #ffffff;
  border: 1rpx solid rgba(31, 27, 20, 0.06);
  border-radius: 18rpx;
  box-shadow: 0 8rpx 24rpx rgba(31, 27, 20, 0.05);
}

.contribution-card__content {
  display: flex;
  gap: 18rpx;
  width: 100%;
}

.contribution-card__cover {
  flex-shrink: 0;
  width: 150rpx;
  height: 150rpx;
  background: #eeeeee;
  border-radius: 14rpx;
}

.contribution-card__main {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 1;
  min-width: 0;
  height: 150rpx;
  box-sizing: border-box;
  padding: 4rpx 0;
}

.contribution-card__title {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  font-size: 29rpx;
  font-weight: 900;
  line-height: 1.35;
  color: #1f1b14;
  padding-left: 6rpx;
}

.contribution-card__bottom {
  display: flex;
  align-items: center;
  width: 100%;
}

.contribution-card__time {
  margin-left: auto;
  flex-shrink: 0;
  font-size: 24rpx;
  color: #8f8679;
}

.contribution-card__reason-box {
  width: 100%;
  box-sizing: border-box;
  padding: 12rpx 16rpx;
  background: rgba(228, 80, 100, 0.06);
  border-radius: 8rpx;
}

.contribution-card__reason-text {
  font-size: 26rpx;
  font-weight: 800;
  color: #d9435b;
  line-height: 1.45;
}

.contributions-empty {
  padding: 80rpx 0;
}
</style>
