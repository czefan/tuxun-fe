<template>
  <view class="page-home safe-bottom-page--fixed-bar">
    <view class="feed-header">
      <text class="feed-header__title">图寻</text>
      <view class="feed-actions">
        <view class="feed-submit-button" @tap="goSubmit">
          <wd-icon name="plus" color="#1f1b14" size="24rpx" />
          <text class="feed-submit-button__text">投稿</text>
        </view>
        <view class="feed-search-button u-circle-btn" @tap="goSearch">
          <wd-icon name="search-line" color="#211f1b" size="30rpx" />
        </view>
      </view>
    </view>

    <view v-if="searchKeyword" class="feed-search-status">
      <wd-search
        :model-value="searchKeyword"
        custom-class="tx-search"
        disabled
        hide-cancel
        placeholder-left
        placeholder="搜索当期活动"
        @click="goSearch"
      />
      <view class="feed-search-status__clear" @tap="clearSearch">
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

<style scoped lang="scss">
.page-home {
  padding: 24rpx 22rpx 0;
  background: linear-gradient(180deg, rgba(255, 246, 229, 0.92) 0%, rgba(250, 250, 247, 0.96) 260rpx), #f8f7f4;
}

.feed-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  padding: 8rpx 4rpx 18rpx;
}

.feed-header__title {
  display: block;
  font-size: 44rpx;
  font-weight: 900;
  line-height: 1.12;
  color: #211f1b;
}

.feed-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 14rpx;
}

.feed-submit-button {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #ffffff;
  border: 1rpx solid rgba(33, 31, 27, 0.08);
  box-shadow: 0 12rpx 28rpx rgba(33, 31, 27, 0.08);
}

.feed-submit-button {
  gap: 6rpx;
  height: 60rpx;
  min-width: 104rpx;
  padding: 0 14rpx;
  background: #f5c542;
  border-radius: 999rpx;
}

.feed-submit-button__text {
  display: block;
  font-size: 24rpx;
  font-weight: 900;
  color: #1f1b14;
}

.feed-search-status {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin: 0 4rpx 18rpx;
}

.feed-search-status :deep(.wd-search) {
  flex: 1;
  min-width: 0;
}

.feed-search-status__clear {
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
