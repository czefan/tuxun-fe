<template>
  <view class="page-activity safe-bottom-page--fixed-bar">
    <view class="activity-top">
      <view class="activity-top__copy">
        <text class="activity-top__title">{{ activityTitle }}</text>
        <text class="activity-top__subtitle">{{ activitySubtitle }}</text>
      </view>
      <view class="activity-search-button u-circle-btn" @tap="goSearch">
        <wd-icon name="search-line" color="#1f1b14" size="30rpx" />
      </view>
    </view>

    <view v-if="searchKeyword" class="activity-search-status">
      <wd-search
        :model-value="searchKeyword"
        hide-cancel
        custom-class="tx-search"
        placeholder-left
        disabled
        @click="goSearch"
      />
      <view class="activity-search-status__clear" @tap="clearSearch">
        <wd-icon name="close" color="#1f1b14" size="28rpx" />
      </view>
    </view>

    <sort-tabs v-model="sortCurrent" />

    <activity-waterfall-list
      nomore-text="该期活动题目已加载"
      :sort-type="sortType"
      :search-keyword="searchKeyword"
      answer-ended
    />

    <search-overlay
      v-model:visible="searchVisible"
      scope="activity"
      :title="`搜索${activityTitle}`"
      @search="handleSearch"
    />

    <MainTabBar
      v-if="customTabBarVisible"
      :current-path="AppRoute.History"
      @reselect="goHistory"
    />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

import { useTabBarFeedback } from '@/composables/useTabBarFeedback'
import { AppRoute } from '@/router/routes'
import { pastActivityList } from '@/features/history'
import MainTabBar from '@/tabbar/MainTabBar.vue'

definePage({
  style: {
    navigationBarTitleText: '%page.activity%',
  },
})

type SortType = 'hot' | 'latest'

const activityTitle = ref('活动主页')
const activityId = ref('')
const activityPeriod = ref('')
const activityCount = ref<number | null>(null)
const sortCurrent = ref(0)
const searchVisible = ref(false)
const searchKeyword = ref('')

const sortType = computed<SortType>(() => (sortCurrent.value === 0 ? 'hot' : 'latest'))
const { customTabBarVisible } = useTabBarFeedback(goHistory)
const activitySubtitle = computed(() => {
  const meta: string[] = []

  if (activityPeriod.value) {
    meta.push(activityPeriod.value)
  }

  if (activityCount.value !== null) {
    meta.push(`${activityCount.value} 题`)
  }

  return meta.length > 0 ? meta.join(' · ') : '该期题目'
})

onLoad((query) => {
  if (typeof query?.id === 'string') {
    activityId.value = query.id
  }

  const activity = pastActivityList.find(item => String(item.id) === activityId.value)

  if (activity) {
    activityTitle.value = activity.title
    activityPeriod.value = activity.period
    activityCount.value = activity.count
  }
  else {
    if (typeof query?.title === 'string' && query.title) {
      activityTitle.value = decodeURIComponent(query.title)
    }

    if (typeof query?.period === 'string' && query.period) {
      activityPeriod.value = decodeURIComponent(query.period)
    }

    if (typeof query?.count === 'string' && query.count) {
      const count = Number(query.count)
      activityCount.value = Number.isFinite(count) ? count : null
    }
  }

  uni.setNavigationBarTitle({
    title: activityTitle.value,
  })
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

function goHistory() {
  uni.switchTab({
    url: AppRoute.History,
  })
}
</script>

<style scoped lang="scss">
.page-activity {
  padding: 26rpx 24rpx 0;
  background: #f6f4ef;
}

.activity-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
  padding: 2rpx 6rpx 20rpx;
}

.activity-top__copy {
  flex: 1;
  min-width: 0;
}

.activity-top__title,
.activity-top__subtitle {
  display: block;
}

.activity-top__title {
  font-size: 36rpx;
  font-weight: 900;
  line-height: 1.2;
  color: #1f1b14;
}

.activity-top__subtitle {
  overflow: hidden;
  margin-top: 8rpx;
  font-size: 24rpx;
  line-height: 1.35;
  color: #81786c;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.activity-search-status {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin: 0 4rpx 18rpx;
}

.activity-search-status :deep(.wd-search) {
  flex: 1;
  min-width: 0;
}

.activity-search-status__clear {
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
</style>
