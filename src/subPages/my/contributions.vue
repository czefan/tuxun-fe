<template>
  <view class="page-contributions u-page-viewport">
    <view class="u-header-flex">
      <view class="min-w-0 flex-1">
        <text class="block text-44rpx text-[#1f1b14] font-900 leading-[1.15]">{{ t('page.contributions') }}</text>
        <text class="mt-10rpx block text-24rpx text-[#81786c]">{{ t('page.contributions.subtitle') }}</text>
      </view>
      <view class="contributions-search-button u-circle-btn" @tap="goSearch">
        <wd-icon name="search-line" color="#1f1b14" size="30rpx" />
      </view>
    </view>

    <view v-if="searchKeyword" class="flex items-center gap-16rpx px-24rpx pb-18rpx">
      <wd-search
        :model-value="searchKeyword"
        hide-cancel
        custom-class="tx-search"
        placeholder-left
        disabled
        @click="goSearch"
      />
      <view class="box-border h-64rpx w-64rpx flex flex-shrink-0 items-center justify-center border border-[rgba(31,27,20,0.08)] rounded-full border-solid bg-white" @tap="clearSearch">
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
      class="min-h-0 w-full flex-1"
      :current="currentTab"
      @change="onSwiperChange"
    >
      <swiper-item v-for="tab in tabs" :key="tab.key">
        <scroll-view scroll-y class="h-full">
          <view class="u-list-wrapper pb-[calc(48rpx+env(safe-area-inset-bottom))]">
            <view
              v-for="item in getFilteredContributionsByStatus(tab.key)"
              :key="item.id"
              class="u-card-item flex-col gap-16rpx"
            >
              <view class="w-full flex gap-18rpx">
                <image
                  class="u-card-cover"
                  :src="item.cover"
                  lazy-load
                  mode="aspectFill"
                />
                <view class="u-card-main">
                  <text class="u-card-title pl-6rpx">{{ item.title }}</text>
                  <view class="w-full flex items-center">
                    <status-tag :status="item.status" />
                    <text class="ml-auto block flex-shrink-0 text-24rpx text-[#8f8679]">{{ item.time }}</text>
                  </view>
                </view>
              </view>

              <!-- 反馈原因整栏展开提示条 -->
              <view v-if="item.status === 'rejected' && item.reason" class="box-border w-100% rounded-8rpx bg-[#e45064]/[0.06] px-16rpx py-12rpx">
                <text class="block text-26rpx text-[#d9435b] font-800 leading-[1.45]">反馈：{{ item.reason }}</text>
              </view>
            </view>

            <!-- 缺省状态 -->
            <view v-if="!getFilteredContributionsByStatus(tab.key).length" class="py-80rpx">
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
