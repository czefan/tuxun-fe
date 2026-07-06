<template>
  <view class="page-history safe-bottom-page--fixed-bar bg-[#f6f4ef] px-22rpx">
    <view class="flex items-start justify-between gap-20rpx px-6rpx pb-22rpx pt-30rpx">
      <view>
        <text class="block truncate text-46rpx text-[#1f1b14] font-900 leading-[1.12]">往期</text>
        <text class="mt-8rpx block text-24rpx text-[#81786c]">活动期刊</text>
      </view>
      <view class="history-search-button u-circle-btn" @tap="goSearch">
        <wd-icon name="search-line" color="#1f1b14" size="30rpx" />
      </view>
    </view>

    <view v-if="searchKeyword" class="mx-4rpx mb-18rpx flex items-center gap-16rpx">
      <wd-search
        :model-value="searchKeyword"
        custom-class="tx-search"
        disabled
        hide-cancel
        placeholder-left
        placeholder="搜索往期活动"
        @click="goSearch"
      />
      <view class="box-border h-64rpx w-64rpx flex flex-shrink-0 items-center justify-center border border-[rgba(31,27,20,0.08)] rounded-full border-solid bg-white" @tap="clearSearch">
        <wd-icon name="close" color="#1f1b14" size="28rpx" />
      </view>
    </view>

    <sort-tabs v-model="sortCurrent" />

    <view class="flex flex-col gap-10rpx">
      <view
        v-for="item in visibleActivities"
        :key="item.id"
        class="flex items-stretch gap-22rpx rounded-12rpx bg-white pr-14rpx shadow-[0_10rpx_28rpx_rgba(31,26,18,0.06)]"
        @tap="goActivity(item)"
      >
        <view class="relative h-220rpx w-270rpx flex flex-shrink-0 overflow-hidden rounded-[12rpx_0_0_12rpx]" :style="{ background: item.coverTone }">
          <image
            class="absolute inset-0 block h-full w-full"
            :src="item.cover"
            lazy-load
            mode="aspectFill"
          />
        </view>

        <view class="min-w-0 flex flex-1 flex-col justify-center py-14rpx">
          <view class="flex items-start justify-between gap-10rpx">
            <text class="line-clamp-2 block flex-1 text-31rpx text-[#1f1b14] font-900 leading-[1.34]">{{ item.title }}</text>
            <text class="block flex-shrink-0 pt-4rpx text-22rpx text-[#9a9287] font-800">{{ item.period }}</text>
          </view>
          <text class="line-clamp-2 mt-10rpx block text-24rpx text-[#746b60] leading-[1.42]">{{ item.desc }}</text>
          <view class="mt-16rpx flex items-center gap-8rpx">
            <text class="block text-22rpx text-[#b98200] font-800">{{ item.count }} 题</text>
            <text class="block text-22rpx text-[#b98200] font-800">·</text>
            <text class="block text-22rpx text-[#b98200] font-800">{{ item.heatLabel }} 热度</text>
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
