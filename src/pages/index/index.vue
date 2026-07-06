<template>
  <view class="page-home safe-bottom-page--fixed-bar box-border min-h-100vh p-[24rpx_22rpx_0] pb-[calc(112rpx+env(safe-area-inset-bottom))]" :style="pageStyle">
    <view class="flex items-center justify-between gap-24rpx p-[8rpx_4rpx_18rpx]">
      <text class="block text-44rpx text-[#211f1b] font-900 leading-[1.12]">图寻</text>
      <view class="flex flex-shrink-0 items-center gap-14rpx">
        <view class="h-60rpx min-w-104rpx flex flex-shrink-0 cursor-pointer items-center justify-center gap-6rpx border border-[rgba(33,31,27,0.08)] rounded-full border-solid bg-brand px-14rpx shadow-[0_12rpx_28rpx_rgba(33,31,27,0.08)]" @tap="goSubmit">
          <wd-icon name="plus" color="#1f1b14" size="24rpx" />
          <text class="block text-24rpx text-[#1f1b14] font-900">投稿</text>
        </view>
        <view class="feed-search-button u-circle-btn" @tap="goSearch">
          <wd-icon name="search-line" color="#211f1b" size="30rpx" />
        </view>
      </view>
    </view>

    <view v-if="searchKeyword" class="m-[0_4rpx_18rpx] flex items-center gap-16rpx">
      <wd-search
        :model-value="searchKeyword"
        custom-class="tx-search"
        disabled
        hide-cancel
        placeholder-left
        placeholder="搜索当期活动"
        @click="goSearch"
      />
      <view class="box-border h-64rpx w-64rpx flex flex-shrink-0 cursor-pointer items-center justify-center border border-[rgba(31,27,20,0.08)] rounded-full border-solid bg-white" @tap="clearSearch">
        <wd-icon name="close" color="#1f1b14" size="28rpx" />
      </view>
    </view>

    <sort-tabs v-model="sortCurrent" />

    <activity-waterfall-list
      :sort-type="sortType"
      :search-keyword="searchKeyword"
      :nomore-text="searchKeyword ? '搜索结果已展示完' : '活动已加载完'"
    />

    <search-overlay
      v-model:visible="searchVisible"
      scope="home"
      title="搜索当期活动"
      @search="handleSearch"
    />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { AppRoute } from '@/router/routes'

definePage({
  type: 'home',
  style: {
    navigationBarTitleText: '%page.home%',
  },
})

type SortType = 'hot' | 'latest'

const sortCurrent = ref(0)
const searchVisible = ref(false)
const searchKeyword = ref('')

const sortType = computed<SortType>(() => (sortCurrent.value === 0 ? 'hot' : 'latest'))
const pageStyle = computed(() => ({
  background: 'linear-gradient(180deg, rgba(255, 246, 229, 0.92) 0%, rgba(250, 250, 247, 0.96) 260rpx), #f8f7f4',
}))

const { ensureLogin } = useAuth()

function goSearch() {
  searchVisible.value = true
}

function handleSearch(keyword: string) {
  searchKeyword.value = keyword
}

function clearSearch() {
  searchKeyword.value = ''
}

async function goSubmit() {
  if (!(await ensureLogin())) {
    return
  }

  uni.navigateTo({
    url: AppRoute.Contribute,
  })
}
</script>
