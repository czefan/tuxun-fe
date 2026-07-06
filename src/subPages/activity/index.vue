<template>
  <view class="page-activity safe-bottom-page--fixed-bar bg-[#f6f4ef] p-[26rpx_24rpx_0]">
    <view class="flex items-start justify-between gap-18rpx p-[2rpx_6rpx_20rpx]">
      <view class="min-w-0 flex-1">
        <text class="block text-36rpx text-[#1f1b14] font-900 leading-[1.2em]">{{ activityTitle }}</text>
        <text class="mt-8rpx block truncate text-24rpx text-[#81786c] leading-[1.35em]">{{ activitySubtitle }}</text>
      </view>
      <view class="activity-search-button u-circle-btn" @tap="goSearch">
        <wd-icon name="search-line" color="#1f1b14" size="30rpx" />
      </view>
    </view>

    <view v-if="searchKeyword" class="m-[0_4rpx_18rpx] flex items-center gap-16rpx">
      <wd-search
        :model-value="searchKeyword"
        hide-cancel
        custom-class="tx-search"
        placeholder-left
        disabled
        @click="goSearch"
      />
      <view class="box-border h-64rpx w-64rpx flex flex-shrink-0 cursor-pointer items-center justify-center border border-[rgba(31,27,20,0.08)] rounded-full border-solid bg-white" @tap="clearSearch">
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
