<template>
  <view class="page-notice safe-bottom-page--fixed-bar bg-white px-30rpx pt-28rpx">
    <view class="flex items-start justify-between gap-20rpx pb-30rpx pt-12rpx">
      <view>
        <text class="block text-42rpx text-[#1f1b14] font-900">消息中心</text>
        <text class="mt-8rpx block text-24rpx text-[#9f9f9f]">只展示官方提示消息</text>
      </view>
      <view class="notice-search-button u-circle-btn" @tap="goSearch">
        <wd-icon name="search-line" color="#1f1b14" size="30rpx" />
      </view>
    </view>

    <view v-if="searchKeyword" class="mb-20rpx flex items-center gap-16rpx">
      <wd-search
        :model-value="searchKeyword"
        custom-class="tx-search"
        disabled
        hide-cancel
        placeholder-left
        placeholder="搜索通知"
        @click="goSearch"
      />
      <view class="box-border h-64rpx w-64rpx flex flex-shrink-0 items-center justify-center border border-[rgba(31,27,20,0.08)] rounded-full border-solid bg-white" @tap="clearSearch">
        <wd-icon name="close" color="#1f1b14" size="28rpx" />
      </view>
    </view>

    <view v-for="group in visibleNoticeGroups" :key="group.label" class="notice-group mb-34rpx">
      <text class="mb-10rpx block text-24rpx text-[#8b8b8b] font-700">{{ group.label }}</text>

      <view
        v-for="notice in group.items"
        :key="notice.id"
        class="group notice-row flex items-start gap-22rpx bg-white pt-22rpx"
        @tap="goNoticeDetail(notice)"
      >
        <view class="mt-2rpx flex-shrink-0">
          <view class="relative h-64rpx w-64rpx">
            <wd-avatar text="通" size="64rpx" bg-color="#5ec7d3" color="#ffffff" />
            <view v-if="!notice.read" class="absolute right-[-1rpx] top-[-1rpx] z-1 h-14rpx w-14rpx border-2rpx border-white rounded-full border-solid bg-[#fa4350]" />
          </view>
        </view>
        <view class="min-w-0 flex-1 border-0 border-b border-[#eeeeee] border-solid pb-22rpx group-last:border-b-0">
          <view class="flex items-start justify-between gap-18rpx">
            <text class="block flex-1 truncate text-32rpx text-[#161616] font-900">{{ notice.title }}</text>
            <text class="block flex-shrink-0 text-28rpx text-[#777777]">{{ notice.time }}</text>
          </view>
          <text class="mt-10rpx block truncate text-28rpx text-[#7f7f7f] leading-[1.4]">{{ notice.summary }}</text>
        </view>
      </view>
    </view>

    <view v-if="!visibleNoticeGroups.length" class="pb-120rpx pt-80rpx">
      <wd-empty icon="no-result" tip="没有找到相关通知" />
    </view>

    <search-overlay
      v-model:visible="searchVisible"
      scope="notice"
      title="搜索通知"
      @search="handleSearch"
    />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { noticeGroups } from '@/features/notice'
import type { NoticeItem } from '@/features/notice'
import { AppRoute, withQuery } from '@/router/routes'

definePage({
  style: {
    navigationBarTitleText: '%page.notice%',
  },
})

const searchVisible = ref(false)
const searchKeyword = ref('')
const readNoticeIds = ref<number[]>([])

onShow(() => {
  try {
    const ids = uni.getStorageSync('tuxun_read_notices')
    readNoticeIds.value = Array.isArray(ids) ? ids : []
  }
  catch (e) {
    readNoticeIds.value = []
  }
})

const visibleNoticeGroups = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()

  return noticeGroups
    .map((group) => {
      const filteredItems = keyword
        ? group.items.filter(notice =>
            [notice.title, notice.summary, notice.time].some(value =>
              value.toLowerCase().includes(keyword),
            ),
          )
        : group.items

      return {
        ...group,
        items: filteredItems.map(notice => ({
          ...notice,
          read: readNoticeIds.value.includes(notice.id),
        })),
      }
    })
    .filter(group => group.items.length > 0)
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

function markAsRead(id: number) {
  if (!readNoticeIds.value.includes(id)) {
    readNoticeIds.value.push(id)
    try {
      uni.setStorageSync('tuxun_read_notices', readNoticeIds.value)
    }
    catch (e) {
      // ignore
    }
  }
}

function goNoticeDetail(notice: NoticeItem) {
  markAsRead(notice.id)
  uni.navigateTo({
    url: withQuery(AppRoute.NoticeDetail, { id: notice.id }),
  })
}
</script>
