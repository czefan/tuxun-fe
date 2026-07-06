<template>
  <view class="page-mall safe-bottom-page box-border h-100vh flex flex-col bg-[#f6f4ef] pt-28rpx">
    <view class="flex items-start justify-between gap-20rpx p-[10rpx_24rpx_24rpx]">
      <view>
        <text class="block text-46rpx text-[#1f1b14] font-900 leading-[1.12]">积分商城</text>
        <text class="mt-8rpx block text-24rpx text-[#81786c]">兑换活动周边</text>
      </view>
      <view class="mall-search-button u-circle-btn" @tap="goSearch">
        <wd-icon name="search-line" color="#1f1b14" size="30rpx" />
      </view>
    </view>

    <view v-if="searchKeyword" class="flex items-center gap-16rpx p-[0_24rpx_18rpx]">
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

    <!-- 横向 Tabs 切换 -->
    <sliding-tabs
      :list="tabs"
      :model-value="activeTab"
      @change="onTabChange"
    />

    <!-- 左右滑动分页 -->
    <swiper
      class="min-h-0 w-full flex-1"
      :current="currentTab"
      @change="onSwiperChange"
    >
      <!-- 商品列表页 -->
      <swiper-item>
        <scroll-view scroll-y class="h-full">
          <view class="flex gap-16rpx p-[16rpx_24rpx_calc(40rpx+env(safe-area-inset-bottom))]">
            <view class="min-w-0 flex flex-1 flex-col gap-16rpx">
              <view
                v-for="item in list1"
                :key="item.id"
                class="mb-10rpx overflow-hidden rounded-12rpx bg-white shadow-[0_10rpx_28rpx_rgba(31,26,18,0.06)]"
              >
                <view class="relative overflow-hidden bg-[#eee6d6]" :style="getCoverStyle(item)">
                  <image
                    class="absolute inset-0 block h-full w-full"
                    :src="item.cover"
                    lazy-load
                    mode="aspectFill"
                    @tap.stop="previewImage(item.cover)"
                  />
                  <text v-if="item.badge" class="absolute left-12rpx top-12rpx rounded-full bg-brand px-10rpx py-6rpx text-20rpx text-[#1f1b14] font-800">
                    {{ item.badge }}
                  </text>
                </view>
                <view class="px-12rpx pb-12rpx pt-10rpx">
                  <text class="line-clamp-1 block text-24rpx text-[#1f1b14] font-900 leading-[1.28]">{{ item.title }}</text>
                  <text class="line-clamp-1 mt-5rpx block text-20rpx text-[#746b60] leading-[1.3]">{{ item.desc }}</text>
                  <view class="mt-9rpx flex items-center justify-between gap-8rpx">
                    <text class="block text-22rpx text-[#b98200] font-900">{{ item.points }} 积分</text>
                    <text class="block truncate text-18rpx text-[#999999]">{{ item.stockText }}</text>
                  </view>
                  <button
                    class="mt-10rpx h-46rpx w-full flex items-center justify-center border-0 rounded-full p-0 text-22rpx font-900 after:border-none"
                    :class="canExchangeProduct(item) ? 'bg-brand text-[#1f1b14]' : 'bg-[#ece7dc] text-[#8a8175]'"
                    :disabled="!canExchangeProduct(item)"
                    @tap.stop="handleExchangeTap(item)"
                  >
                    {{ getExchangeButtonText(item) }}
                  </button>
                </view>
              </view>
            </view>

            <view class="min-w-0 flex flex-1 flex-col gap-16rpx">
              <view
                v-for="item in list2"
                :key="item.id"
                class="mb-10rpx overflow-hidden rounded-12rpx bg-white shadow-[0_10rpx_28rpx_rgba(31,26,18,0.06)]"
              >
                <view class="relative overflow-hidden bg-[#eee6d6]" :style="getCoverStyle(item)">
                  <image
                    class="absolute inset-0 block h-full w-full"
                    :src="item.cover"
                    lazy-load
                    mode="aspectFill"
                    @tap.stop="previewImage(item.cover)"
                  />
                  <text v-if="item.badge" class="absolute left-12rpx top-12rpx rounded-full bg-brand px-10rpx py-6rpx text-20rpx text-[#1f1b14] font-800">
                    {{ item.badge }}
                  </text>
                </view>
                <view class="px-12rpx pb-12rpx pt-10rpx">
                  <text class="line-clamp-1 block text-24rpx text-[#1f1b14] font-900 leading-[1.28]">{{ item.title }}</text>
                  <text class="line-clamp-1 mt-5rpx block text-20rpx text-[#746b60] leading-[1.3]">{{ item.desc }}</text>
                  <view class="mt-9rpx flex items-center justify-between gap-8rpx">
                    <text class="block text-22rpx text-[#b98200] font-900">{{ item.points }} 积分</text>
                    <text class="block truncate text-18rpx text-[#999999]">{{ item.stockText }}</text>
                  </view>
                  <button
                    class="mt-10rpx h-46rpx w-full flex items-center justify-center border-0 rounded-full p-0 text-22rpx font-900 after:border-none"
                    :class="canExchangeProduct(item) ? 'bg-brand text-[#1f1b14]' : 'bg-[#ece7dc] text-[#8a8175]'"
                    :disabled="!canExchangeProduct(item)"
                    @tap.stop="handleExchangeTap(item)"
                  >
                    {{ getExchangeButtonText(item) }}
                  </button>
                </view>
              </view>
            </view>
          </view>
          <view v-if="!visibleProducts.length" class="py-[80rpx_0_120rpx]">
            <wd-empty icon="no-result" tip="没有找到相关商品" />
          </view>
        </scroll-view>
      </swiper-item>

      <!-- 兑换记录页 -->
      <swiper-item>
        <scroll-view scroll-y class="h-full">
          <view class="flex flex-col gap-18rpx p-[16rpx_24rpx_calc(40rpx+env(safe-area-inset-bottom))]">
            <view v-if="!userStore.isLoggedIn()" class="flex flex-col items-center py-120rpx">
              <wd-empty icon="no-content" :tip="exchangeRecordsEmptyText" />
            </view>
            <view
              v-for="record in visibleExchangeRecords"
              :key="record.id"
              class="flex flex-col gap-16rpx border border-[rgba(31,27,20,0.06)] rounded-18rpx border-solid bg-white p-18rpx shadow-[0_8rpx_24rpx_rgba(31,27,20,0.05)]"
            >
              <view class="w-full flex gap-18rpx">
                <image
                  class="h-150rpx w-150rpx flex-shrink-0 rounded-14rpx bg-[#eeeeee]"
                  :src="record.cover"
                  lazy-load
                  mode="aspectFill"
                />
                <view class="box-border min-h-150rpx min-w-0 flex flex-1 flex-col justify-between">
                  <view class="flex items-start justify-between gap-14rpx">
                    <text class="line-clamp-2 block text-29rpx text-[#1f1b14] font-900 leading-[1.35]">{{ record.title }}</text>
                  </view>

                  <view class="mt-10rpx flex items-center justify-between">
                    <text class="text-23rpx text-[#8f8679]">{{ record.time }}</text>
                    <text class="text-23rpx text-[#b98200] font-800">共消耗 {{ record.totalPoints }} 积分</text>
                  </view>

                  <view class="mt-14rpx flex items-center justify-between">
                    <text class="text-24rpx text-[#8f8679] font-900">数量: x{{ record.count }}</text>
                    <status-tag
                      :status="record.status === 'pending' ? 'pending' : 'approved'"
                      :label="record.status === 'pending' ? '待领取' : '已完成'"
                    />
                  </view>
                </view>
              </view>

              <!-- 核销码展示 -->
              <view v-if="record.status === 'pending' && record.exchangeCode" class="flex items-center justify-between rounded-8rpx bg-[#f5c542]/8 p-[12rpx_16rpx]">
                <text class="text-28rpx text-[#9b7621] font-900">核销码：{{ record.exchangeCode }}</text>
                <text class="cursor-pointer rounded-6rpx bg-[#42a661]/10 p-[4rpx_12rpx] text-26rpx text-[#2f8f4c] font-900" @tap.stop="copyText(record.exchangeCode)">复制</text>
              </view>
            </view>

            <view v-if="userStore.isLoggedIn() && !visibleExchangeRecords.length" class="py-120rpx">
              <wd-empty icon="no-content" :tip="exchangeRecordsEmptyText" />
            </view>
          </view>
        </scroll-view>
      </swiper-item>
    </swiper>

    <search-overlay
      v-model:visible="searchVisible"
      scope="mall"
      title="搜索积分商城"
      @search="handleSearch"
    />

    <!-- 自定义轻量兑换确认抽屉 -->
    <view v-if="exchangeVisible && selectedProduct" class="fixed inset-0 bottom-[-1px] z-999 flex items-end bg-[#1f1b14]/48" @tap="closeExchange">
      <view class="box-border w-full rounded-[30rpx_30rpx_0_0] bg-white p-[40rpx_36rpx_calc(40rpx+env(safe-area-inset-bottom))] animate-slide-up" @tap.stop>
        <view class="relative flex items-start gap-28rpx">
          <image class="h-140rpx w-140rpx border border-[rgba(31,27,20,0.08)] rounded-18rpx border-solid bg-[#f8f6f2] shadow-[0_8rpx_20rpx_rgba(31,27,20,0.05)]" :src="selectedProduct.cover" lazy-load mode="aspectFill" />
          <view class="min-w-0 flex-1">
            <text class="block text-32rpx text-[#1f1b14] font-900 leading-1.3">{{ selectedProduct.title }}</text>
            <text class="mt-10rpx block text-28rpx text-[#b98200] font-800">{{ selectedProduct.points }} 积分 / 件</text>
            <text class="mt-8rpx block text-22rpx text-[#9a9286]">{{ selectedProduct.stockText }}</text>
          </view>
          <view class="absolute right-[-10rpx] top-[-10rpx] h-44rpx w-44rpx flex cursor-pointer items-center justify-center text-36rpx text-[#c8c1b8] font-300" @tap="closeExchange">
            ×
          </view>
        </view>

        <view class="my-32rpx h-1rpx bg-[#1f1b14]/6" />

        <view class="mb-24rpx flex items-center justify-between gap-20rpx">
          <text class="block text-28rpx text-[#1f1b14] font-800">兑换数量</text>
          <view class="h-60rpx flex items-center overflow-hidden rounded-12rpx bg-[#f8f6f2]">
            <view
              class="h-60rpx w-60rpx flex cursor-pointer items-center justify-center bg-[#eeeae4] text-28rpx text-[#1f1b14] font-900 transition-colors duration-150 ease-in-out active:bg-[#e2dcd4]"
              :class="[exchangeCount <= 1 ? 'text-[#c8c1b8] bg-[#f8f6f2] pointer-events-none' : '']"
              @tap="adjustCount(-1)"
            >
              -
            </view>
            <input
              v-model.number="exchangeCount"
              type="number"
              class="h-60rpx w-80rpx border-0 bg-transparent text-center text-26rpx text-[#1f1b14] font-800"
              @blur="onStepperBlur"
            >
            <view
              class="h-60rpx w-60rpx flex cursor-pointer items-center justify-center bg-[#eeeae4] text-28rpx text-[#1f1b14] font-900 transition-colors duration-150 ease-in-out active:bg-[#e2dcd4]"
              :class="[exchangeCount >= maxStock ? 'text-[#c8c1b8] bg-[#f8f6f2] pointer-events-none' : '']"
              @tap="adjustCount(1)"
            >
              +
            </view>
          </view>
        </view>

        <view class="mb-40rpx mt-32rpx flex items-center justify-between gap-20rpx">
          <text class="block text-28rpx text-[#1f1b14] font-800">总计消耗</text>
          <text class="block text-34rpx text-[#b98200] font-900">{{ totalPoints }} 积分</text>
        </view>

        <button class="m-0 h-88rpx w-full flex items-center justify-center border-0 rounded-full bg-brand p-0 text-30rpx text-[#1f1b14] font-900 shadow-[0_10rpx_28rpx_rgba(245,197,66,0.3)] after:border-0" @tap="confirmExchange">
          确认兑换
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useMall } from './composables/useMall'
import { canExchangeProduct, getExchangeButtonText } from './features'
import type { ProductItem } from './features'
import { useUserStore } from '@/store/user'
import { previewImage } from '@/utils'

definePage({
  style: {
    navigationBarTitleText: '%page.mall%',
  },
})

const userStore = useUserStore()
const {
  tabs,
  activeTab,
  currentTab,
  onTabChange,
  onSwiperChange,
  searchVisible,
  searchKeyword,
  visibleProducts,
  list1,
  list2,
  goSearch,
  handleSearch,
  clearSearch,
  exchangeVisible,
  selectedProduct,
  exchangeCount,
  visibleExchangeRecords,
  exchangeRecordsEmptyText,
  totalPoints,
  maxStock,
  handleExchangeTap,
  closeExchange,
  adjustCount,
  onStepperBlur,
  copyText,
  confirmExchange,
} = useMall()

function getCoverStyle(item: ProductItem) {
  return {
    paddingBottom: `${(item.coverHeight / item.coverWidth) * 100}%`,
  }
}
</script>
