<template>
  <view class="page-mall safe-bottom-page">
    <view class="page-mall__header">
      <view>
        <text class="page-mall__title">积分商城</text>
        <text class="page-mall__subtitle">兑换活动周边</text>
      </view>
      <view class="mall-search-button u-circle-btn" @tap="goSearch">
        <wd-icon name="search-line" color="#1f1b14" size="30rpx" />
      </view>
    </view>

    <view v-if="searchKeyword" class="mall-search-status">
      <wd-search
        :model-value="searchKeyword"
        hide-cancel
        custom-class="tx-search"
        placeholder-left
        disabled
        @click="goSearch"
      />
      <view class="mall-search-status__clear" @tap="clearSearch">
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
      class="mall-swiper"
      :current="currentTab"
      @change="onSwiperChange"
    >
      <!-- 商品列表页 -->
      <swiper-item>
        <scroll-view scroll-y class="swiper-scroll">
          <view class="mall-grid">
            <view class="mall-column">
              <product-card
                v-for="item in list1"
                :key="item.id"
                :product="item"
                @preview="previewImage"
                @exchange="handleExchangeTap"
              />
            </view>

            <view class="mall-column">
              <product-card
                v-for="item in list2"
                :key="item.id"
                :product="item"
                @preview="previewImage"
                @exchange="handleExchangeTap"
              />
            </view>
          </view>
          <view v-if="!visibleProducts.length" class="mall-empty">
            <wd-empty icon="no-result" tip="没有找到相关商品" />
          </view>
        </scroll-view>
      </swiper-item>

      <!-- 兑换记录页 -->
      <swiper-item>
        <scroll-view scroll-y class="swiper-scroll">
          <view class="exchange-list">
            <view v-if="!userStore.isLoggedIn()" class="exchange-login-empty">
              <wd-empty icon="no-content" :tip="exchangeRecordsEmptyText" />
            </view>
            <view
              v-for="record in visibleExchangeRecords"
              :key="record.id"
              class="exchange-card"
            >
              <view class="exchange-card__content">
                <image
                  class="exchange-card__cover"
                  :src="record.cover"
                  lazy-load
                  mode="aspectFill"
                />
                <view class="exchange-card__main">
                  <view class="exchange-card__top">
                    <text class="exchange-card__title">{{ record.title }}</text>
                  </view>

                  <view class="exchange-card__meta-row">
                    <text class="exchange-card__time">{{ record.time }}</text>
                    <text class="exchange-card__points">共消耗 {{ record.totalPoints }} 积分</text>
                  </view>

                  <view class="exchange-card__bottom">
                    <text class="exchange-card__count">数量: x{{ record.count }}</text>
                    <status-tag
                      :status="record.status === 'pending' ? 'pending' : 'approved'"
                      :label="record.status === 'pending' ? '待领取' : '已完成'"
                    />
                  </view>
                </view>
              </view>

              <!-- 核销码展示 -->
              <view v-if="record.status === 'pending' && record.exchangeCode" class="exchange-card__code-box">
                <text class="exchange-card__code-text">核销码：{{ record.exchangeCode }}</text>
                <text class="exchange-card__copy-btn" @tap.stop="copyText(record.exchangeCode)">复制</text>
              </view>
            </view>

            <view v-if="userStore.isLoggedIn() && !visibleExchangeRecords.length" class="exchange-empty">
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
    <view v-if="exchangeVisible && selectedProduct" class="custom-drawer-mask" @tap="closeExchange">
      <view class="custom-drawer" @tap.stop>
        <view class="custom-drawer__header">
          <image class="custom-drawer__cover" :src="selectedProduct.cover" lazy-load mode="aspectFill" />
          <view class="custom-drawer__info">
            <text class="custom-drawer__title">{{ selectedProduct.title }}</text>
            <text class="custom-drawer__points">{{ selectedProduct.points }} 积分 / 件</text>
            <text class="custom-drawer__stock">{{ selectedProduct.stockText }}</text>
          </view>
          <view class="custom-drawer__close" @tap="closeExchange">
            ×
          </view>
        </view>

        <view class="custom-drawer__divider" />

        <view class="custom-drawer__row">
          <text class="custom-drawer__row-label">兑换数量</text>
          <view class="custom-stepper">
            <view
              class="custom-stepper__btn"
              :class="{ 'custom-stepper__btn--disabled': exchangeCount <= 1 }"
              @tap="adjustCount(-1)"
            >
              -
            </view>
            <input
              v-model.number="exchangeCount"
              type="number"
              class="custom-stepper__input"
              @blur="onStepperBlur"
            >
            <view
              class="custom-stepper__btn"
              :class="{ 'custom-stepper__btn--disabled': exchangeCount >= maxStock }"
              @tap="adjustCount(1)"
            >
              +
            </view>
          </view>
        </view>

        <view class="custom-drawer__row custom-drawer__row--total">
          <text class="custom-drawer__row-label">总计消耗</text>
          <text class="custom-drawer__total-points">{{ totalPoints }} 积分</text>
        </view>

        <button class="custom-drawer__submit" @tap="confirmExchange">
          确认兑换
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import ProductCard from './components/ProductCard.vue'
import { useMallExchange } from './composables/useMallExchange'
import { useMallSearch } from './composables/useMallSearch'
import { useMallTabs } from './composables/useMallTabs'
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
  switchTab,
  onTabChange,
  onSwiperChange,
} = useMallTabs()

const {
  searchVisible,
  searchKeyword,
  visibleProducts,
  list1,
  list2,
  goSearch,
  handleSearch,
  clearSearch,
} = useMallSearch()

const {
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
} = useMallExchange({ searchKeyword, switchTab })
</script>

<style scoped lang="scss">
.page-mall {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding-top: 28rpx;
  background: #f6f4ef;
  box-sizing: border-box;
}

.page-mall__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
  padding: 10rpx 24rpx 24rpx;
}

.page-mall__title,
.page-mall__subtitle {
  display: block;
}

.page-mall__title {
  font-size: 46rpx;
  font-weight: 900;
  line-height: 1.12;
  color: #1f1b14;
}

.page-mall__subtitle {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #81786c;
}

.mall-search-status {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 0 24rpx 18rpx;
}

.mall-search-status :deep(.wd-search) {
  flex: 1;
  min-width: 0;
}

.mall-search-status__clear {
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

/* Swiper 滑动层自适应满高 */
.mall-swiper {
  flex: 1;
  min-height: 0;
  width: 100%;
}

.swiper-scroll {
  height: 100%;
}

/* 瀑布流网格微调 */
.mall-grid {
  display: flex;
  gap: 16rpx;
  padding: 16rpx 24rpx calc(40rpx + env(safe-area-inset-bottom));
}

.mall-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  min-width: 0;
}

.mall-empty {
  padding: 80rpx 0 120rpx;
}

/* 兑换记录列表与卡片样式 */
.exchange-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  padding: 16rpx 24rpx calc(40rpx + env(safe-area-inset-bottom));
}

.exchange-card {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding: 18rpx;
  background: #ffffff;
  border: 1rpx solid rgba(31, 27, 20, 0.06);
  border-radius: 18rpx;
  box-shadow: 0 8rpx 24rpx rgba(31, 27, 20, 0.05);
}

.exchange-card__content {
  display: flex;
  gap: 18rpx;
  width: 100%;
}

.exchange-card__cover {
  flex-shrink: 0;
  width: 150rpx;
  height: 150rpx;
  background: #eeeeee;
  border-radius: 14rpx;
}

.exchange-card__main {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 1;
  min-width: 0;
  min-height: 150rpx;
  box-sizing: border-box;
}

.exchange-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14rpx;
}

.exchange-card__title {
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

.exchange-card__meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10rpx;
}

.exchange-card__time {
  font-size: 23rpx;
  color: #8f8679;
}

.exchange-card__points {
  font-size: 23rpx;
  font-weight: 800;
  color: #b98200;
}

.exchange-card__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14rpx;
}

.exchange-card__count {
  font-size: 24rpx;
  font-weight: 900;
  color: #8f8679;
}

.exchange-card__code-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx 16rpx;
  background: rgba(245, 197, 66, 0.08);
  border-radius: 8rpx;
}

.exchange-card__code-text {
  font-size: 28rpx;
  font-weight: 900;
  color: #9b7621;
}

.exchange-card__copy-btn {
  font-size: 26rpx;
  font-weight: 900;
  color: #2f8f4c;
  padding: 4rpx 12rpx;
  background: rgba(66, 166, 97, 0.1);
  border-radius: 6rpx;
}

.exchange-empty {
  padding: 120rpx 0;
}

.exchange-login-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
}

/* 自定义轻量兑换抽屉样式 */
.custom-drawer-mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: -1px;
  left: 0;
  z-index: 999;
  background: rgba(31, 27, 20, 0.48);
  display: flex;
  align-items: flex-end;
}

.custom-drawer {
  width: 100%;
  background: #ffffff;
  border-radius: 30rpx 30rpx 0 0;
  padding: 40rpx 36rpx calc(40rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  animation: slide-up 0.23s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
}

@keyframes slide-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.custom-drawer__header {
  display: flex;
  gap: 28rpx;
  align-items: flex-start;
  position: relative;
}

.custom-drawer__cover {
  width: 140rpx;
  height: 140rpx;
  background: #f8f6f2;
  border: 1rpx solid rgba(31, 27, 20, 0.08);
  border-radius: 18rpx;
  box-shadow: 0 8rpx 20rpx rgba(31, 27, 20, 0.05);
}

.custom-drawer__info {
  flex: 1;
  min-width: 0;
}

.custom-drawer__title,
.custom-drawer__points,
.custom-drawer__stock,
.custom-drawer__row-label,
.custom-drawer__total-points {
  display: block;
}

.custom-drawer__title {
  font-size: 32rpx;
  font-weight: 900;
  color: #1f1b14;
  line-height: 1.3;
}

.custom-drawer__points {
  margin-top: 10rpx;
  font-size: 28rpx;
  font-weight: 800;
  color: #b98200;
}

.custom-drawer__stock {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #9a9286;
}

.custom-drawer__close {
  position: absolute;
  top: -10rpx;
  right: -10rpx;
  width: 44rpx;
  height: 44rpx;
  font-size: 36rpx;
  font-weight: 300;
  color: #c8c1b8;
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-drawer__divider {
  height: 1rpx;
  margin: 32rpx 0;
  background: rgba(31, 27, 20, 0.06);
}

.custom-drawer__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 24rpx;
}

.custom-drawer__row--total {
  margin-top: 32rpx;
  margin-bottom: 40rpx;
}

.custom-drawer__row-label {
  font-size: 28rpx;
  font-weight: 800;
  color: #1f1b14;
}

.custom-drawer__total-points {
  font-size: 34rpx;
  font-weight: 900;
  color: #b98200;
}

/* 自定义步进器 */
.custom-stepper {
  display: flex;
  align-items: center;
  background: #f8f6f2;
  border-radius: 12rpx;
  overflow: hidden;
  height: 60rpx;
}

.custom-stepper__btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: 900;
  color: #1f1b14;
  background: #eeeae4;
  transition: background 0.15s ease;
}

.custom-stepper__btn:active {
  background: #e2dcd4;
}

.custom-stepper__btn--disabled {
  color: #c8c1b8;
  background: #f8f6f2;
  pointer-events: none;
}

.custom-stepper__input {
  width: 80rpx;
  height: 60rpx;
  text-align: center;
  font-size: 26rpx;
  font-weight: 800;
  color: #1f1b14;
  border: 0;
  background: transparent;
}

.custom-drawer__submit {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 88rpx;
  margin: 0;
  padding: 0;
  font-size: 30rpx;
  font-weight: 900;
  color: #1f1b14;
  background: var(--tx-color-primary);
  border: 0;
  border-radius: 999rpx;
  box-shadow: 0 10rpx 28rpx rgba(245, 197, 66, 0.3);
}

.custom-drawer__submit::after {
  border: 0;
}
</style>
