<template>
  <view class="page-answers safe-bottom-page">
    <view class="answers-header">
      <view class="answers-header__main">
        <text class="answers-header__title">{{ t('page.answers') }}</text>
        <text class="answers-header__subtitle">{{ t('page.answers.subtitle') }}</text>
      </view>
      <view class="answers-search-button u-circle-btn" @tap="goSearch">
        <wd-icon name="search-line" color="#1f1b14" size="30rpx" />
      </view>
    </view>

    <view v-if="searchKeyword" class="answers-search-status">
      <wd-search
        :model-value="searchKeyword"
        hide-cancel
        custom-class="tx-search"
        placeholder-left
        disabled
        @click="goSearch"
      />
      <view class="answers-search-status__clear" @tap="clearSearch">
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
      class="answers-swiper"
      :current="currentTab"
      @change="onSwiperChange"
    >
      <swiper-item v-for="tab in tabs" :key="tab.key">
        <scroll-view scroll-y class="swiper-scroll">
          <view class="answer-question-list">
            <view
              v-for="item in getFilteredAnswersByStatus(tab.key)"
              :key="item.questionId"
              class="answer-question"
              @tap="goQuestion(item)"
            >
              <image
                class="answer-question__cover"
                :src="item.cover"
                lazy-load
                mode="aspectFill"
              />
              <view class="answer-question__main">
                <text class="answer-question__title">{{ item.title }}</text>
                <view class="answer-question__bottom">
                  <status-tag :status="item.latestStatus" />
                  <text class="answer-question__count">{{ item.usedCount }}/{{ item.limitCount }}</text>
                  <text class="answer-question__time">{{ item.latestTime }}</text>
                </view>
              </view>
            </view>

            <!-- 空状态 -->
            <view v-if="!getFilteredAnswersByStatus(tab.key).length" class="answers-empty">
              <wd-empty icon="no-content" :tip="answersEmptyText" />
            </view>
          </view>
        </scroll-view>
      </swiper-item>
    </swiper>

    <search-overlay
      v-model:visible="searchVisible"
      scope="answers"
      :title="t('search.title.answers')"
      @search="handleSearch"
    />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {

  getAnswerQuestionRecords,
} from './features'
import type { AnswerQuestionRecord, AnswerStatus } from './features'
import { usePrivateList } from '@/composables/usePrivateList'
import { AppRoute, withQuery } from '@/router/routes'
import { t } from '@/locale'

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

<style scoped lang="scss">
.page-answers {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding-top: 34rpx;
  background: #f6f4ef;
  box-sizing: border-box;
}

.answers-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
  padding: 4rpx 24rpx 28rpx;
}

.answers-header__main {
  flex: 1;
  min-width: 0;
}

.answers-header__title,
.answers-header__subtitle,
.answer-question__title,
.answer-question__count {
  display: block;
}

.answers-header__title {
  font-size: 44rpx;
  font-weight: 900;
  line-height: 1.15;
  color: #1f1b14;
}

.answers-header__subtitle {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #81786c;
}

.answers-search-status {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 0 24rpx 18rpx;
}

.answers-search-status :deep(.wd-search) {
  flex: 1;
  min-width: 0;
}

.answers-search-status__clear {
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
.answers-swiper {
  flex: 1;
  min-height: 0;
  width: 100%;
}

.swiper-scroll {
  height: 100%;
}

.answer-question-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  padding: 16rpx 24rpx calc(40rpx + env(safe-area-inset-bottom));
}

.answer-question {
  display: flex;
  gap: 18rpx;
  padding: 18rpx;
  background: #ffffff;
  border: 1rpx solid rgba(31, 27, 20, 0.06);
  border-radius: 18rpx;
  box-shadow: 0 8rpx 24rpx rgba(31, 27, 20, 0.05);
}

.answer-question__cover {
  flex-shrink: 0;
  width: 150rpx;
  height: 150rpx;
  background: #eeeeee;
  border-radius: 14rpx;
}

.answer-question__main {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 1;
  min-width: 0;
  height: 150rpx;
  box-sizing: border-box;
  padding: 4rpx 0;
}

.answer-question__title {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  font-size: 29rpx;
  font-weight: 900;
  line-height: 1.35;
  color: #1f1b14;
}

.answer-question__bottom {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.answer-question__count {
  flex-shrink: 0;
  font-size: 24rpx;
  font-weight: 900;
  color: #9b7621;
}

.answer-question__time {
  margin-left: auto;
  flex-shrink: 0;
  font-size: 24rpx;
  color: #8f8679;
}

.answers-empty {
  padding: 120rpx 0;
}
</style>
