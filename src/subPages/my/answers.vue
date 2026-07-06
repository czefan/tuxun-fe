<template>
  <view class="page-answers u-page-viewport">
    <view class="u-header-flex">
      <view class="min-w-0 flex-1">
        <text class="block text-44rpx text-[#1f1b14] font-900 leading-[1.15]">{{ t('page.answers') }}</text>
        <text class="mt-10rpx block text-24rpx text-[#81786c]">{{ t('page.answers.subtitle') }}</text>
      </view>
      <view class="answers-search-button u-circle-btn" @tap="goSearch">
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
          <view class="u-list-wrapper pb-[calc(40rpx+env(safe-area-inset-bottom))]">
            <view
              v-for="item in getFilteredAnswersByStatus(tab.key)"
              :key="item.questionId"
              class="u-card-item"
              @tap="goQuestion(item)"
            >
              <image
                class="u-card-cover"
                :src="item.cover"
                lazy-load
                mode="aspectFill"
              />
              <view class="u-card-main">
                <text class="u-card-title">{{ item.title }}</text>
                <view class="w-full flex items-center gap-16rpx">
                  <status-tag :status="item.latestStatus" />
                  <text class="block flex-shrink-0 text-24rpx text-[#9b7621] font-900">{{ item.usedCount }}/{{ item.limitCount }}</text>
                  <text class="ml-auto block flex-shrink-0 text-24rpx text-[#8f8679]">{{ item.latestTime }}</text>
                </view>
              </view>
            </view>

            <!-- 空状态 -->
            <view v-if="!getFilteredAnswersByStatus(tab.key).length" class="py-120rpx">
              <wd-empty icon="no-content" :tip="answersEmptyText" />
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
  getAnswerQuestionRecords,
} from './features'
import type { AnswerQuestionRecord, AnswerStatus } from './features'
import { usePrivateList } from '@/composables/usePrivateList'
import { t } from '@/locale'
import { AppRoute, withQuery } from '@/router/routes'

definePage({
  style: {
    navigationBarTitleText: '%page.answers%',
  },
})

type TabKey = 'all' | AnswerStatus

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
  { key: 'correct', title: t('status.correct') },
  { key: 'wrong', title: t('status.wrong') },
]

const statusText: Record<AnswerStatus, string> = {
  pending: t('status.pending'),
  correct: t('status.correct'),
  wrong: t('status.wrong'),
}

const { list: answerQuestions, emptyText: answersEmptyText } = usePrivateList(
  getAnswerQuestionRecords,
  t('empty.answers'),
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

function getFilteredAnswersByStatus(status: TabKey) {
  const statusFiltered
    = status === 'all'
      ? answerQuestions.value
      : answerQuestions.value.filter(item => item.latestStatus === status)
  const keyword = searchKeyword.value.trim().toLowerCase()

  if (!keyword) {
    return statusFiltered
  }

  return statusFiltered.filter(item =>
    [item.title, item.location, item.summary, item.latestStatus, item.latestTime].some(value =>
      value.toLowerCase().includes(keyword),
    ),
  )
}

// 构造通用的 SearchResult 传给 search-overlay 实现无缝搜索
const searchResults = computed(() => {
  return answerQuestions.value.map(record => ({
    id: `answer-${record.questionId}`,
    title: record.title,
    desc: record.summary,
    meta: statusText[record.latestStatus],
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

function goQuestion(item: AnswerQuestionRecord) {
  uni.navigateTo({
    url: withQuery(AppRoute.QuestionDetail, { id: item.questionId }),
  })
}
</script>
