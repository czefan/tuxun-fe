<template>
  <view class="page-profile-sub safe-bottom-page">
    <view class="score-card">
      <view class="score-card__rules-btn" @tap="openRules">
        <wd-icon name="question-circle" :color="BRAND_PRIMARY_COLOR" size="26rpx" />
        <text class="score-card__rules-btn-text">积分规则</text>
      </view>
      <text class="score-card__label">当前总积分</text>
      <text class="score-card__value">{{ scoreValue }}</text>
    </view>

    <view class="ledger-list">
      <view v-for="item in ledgerList" :key="item.id" class="ledger-item">
        <text class="ledger-item__score" :class="{ 'ledger-item__score--minus': item.score < 0 }">
          {{ item.score > 0 ? `+${item.score}` : item.score }}
        </text>
        <view class="ledger-item__content">
          <text class="ledger-item__title">{{ item.title }}</text>
          <text class="ledger-item__time">{{ item.time }}</text>
        </view>
      </view>
      <view v-if="!ledgerList.length" class="ledger-empty">
        <wd-empty icon="no-content" :tip="ledgerEmptyText" />
      </view>
    </view>

    <!-- 积分规则自定义底部抽屉 -->
    <view v-if="rulesVisible" class="custom-drawer-mask" @tap="closeRules">
      <view class="custom-drawer" @tap.stop>
        <view class="custom-drawer__header">
          <text class="custom-drawer__title">积分规则说明</text>
          <view class="custom-drawer__close" @tap="closeRules">
            ×
          </view>
        </view>

        <view class="custom-drawer__divider" />

        <view class="rules-content">
          <!-- 积分获取 -->
          <view class="rule-section">
            <view class="rule-section__header">
              <view class="rule-section__icon-box rule-section__icon-box--green">
                <wd-icon name="plus-circle" color="#2f8f4c" size="28rpx" />
              </view>
              <text class="rule-section__title">如何获取积分</text>
            </view>
            <view class="rule-list">
              <view class="rule-row">
                <text class="rule-row__label">作答正确</text>
                <text class="rule-row__value">+10 积分 / 题</text>
              </view>
              <view class="rule-row">
                <text class="rule-row__label">成功投稿且审核通过</text>
                <text class="rule-row__value">+50 积分 / 题</text>
              </view>
              <view class="rule-row">
                <text class="rule-row__label">参与特定活动或限时挑战</text>
                <text class="rule-row__value">以具体活动规则为准</text>
              </view>
            </view>
          </view>

          <!-- 积分消耗 -->
          <view class="rule-section">
            <view class="rule-section__header">
              <view class="rule-section__icon-box rule-section__icon-box--orange">
                <wd-icon name="minus-circle" color="#b98200" size="28rpx" />
              </view>
              <text class="rule-section__title">积分可以做什么</text>
            </view>
            <view class="rule-list">
              <view class="rule-row">
                <text class="rule-row__label">积分商城兑换</text>
                <text class="rule-row__value">可用于兑换限量周边及活动礼品</text>
              </view>
              <view class="rule-row">
                <text class="rule-row__label">专属挑战入场券</text>
                <text class="rule-row__value">部分高级挑战模式可能需要消耗积分</text>
              </view>
            </view>
          </view>
        </view>

        <button class="custom-drawer__submit" @tap="closeRules">
          我知道了
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { BRAND_PRIMARY_COLOR } from '@/styles/constants'
import { pointLedgerList } from './features'
import { usePrivateList } from '@/composables/usePrivateList'
import { useUserStore } from '@/store/user'

definePage({
  style: {
    navigationBarTitleText: '%page.points%',
  },
})

const userStore = useUserStore()
const rulesVisible = ref(false)
const scoreValue = computed(() => (userStore.isLoggedIn() ? String(userStore.userInfo?.points ?? 0) : '未登录'))
const { list: ledgerList, emptyText: ledgerEmptyText } = usePrivateList(
  () => pointLedgerList,
  '暂无积分明细',
)

function openRules() {
  rulesVisible.value = true
}

function closeRules() {
  rulesVisible.value = false
}
</script>

<style scoped lang="scss">
.page-profile-sub {
  padding: 34rpx 24rpx 0;
  background: #f5f5f5;
}

.score-card {
  position: relative;
  padding: 34rpx;
  background: #332d24;
  border-radius: 30rpx;
}

.score-card__rules-btn {
  position: absolute;
  top: 30rpx;
  right: 30rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 16rpx;
  background: rgba(255, 255, 255, 0.08);
  border: 1rpx solid rgba(245, 197, 66, 0.2);
  border-radius: 999rpx;
  cursor: pointer;

  &:active {
    opacity: 0.86;
  }
}

.score-card__rules-btn-text {
  font-size: 22rpx;
  font-weight: 700;
  color: var(--tx-color-primary);
}

.score-card__label,
.score-card__value,
.ledger-item__score,
.ledger-item__title,
.ledger-item__time {
  display: block;
}

.score-card__label {
  font-size: 26rpx;
  color: var(--tx-color-primary);
}

.score-card__value {
  margin-top: 10rpx;
  font-size: 60rpx;
  font-weight: 900;
  color: #ffffff;
}

.ledger-list {
  margin-top: 24rpx;
}

.ledger-item {
  display: flex;
  gap: 22rpx;
  padding: 26rpx 0;
  border-bottom: 1rpx solid #e8e8e8;
}

.ledger-item__score {
  width: 110rpx;
  font-size: 34rpx;
  font-weight: 900;
  color: #d4a017;
}

.ledger-item__score--minus {
  color: #ff4d4f;
}

.ledger-item__content {
  flex: 1;
}

.ledger-item__title {
  font-size: 30rpx;
  font-weight: 800;
  color: #1f1b14;
}

.ledger-item__time {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #999999;
}

/* 自定义底部抽屉样式 */
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
  align-items: center;
  justify-content: space-between;
  position: relative;
}

.custom-drawer__title {
  font-size: 32rpx;
  font-weight: 900;
  color: #1f1b14;
}

.custom-drawer__close {
  width: 44rpx;
  height: 44rpx;
  font-size: 36rpx;
  font-weight: 300;
  color: #c8c1b8;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.custom-drawer__divider {
  height: 1rpx;
  margin: 32rpx 0;
  background: rgba(31, 27, 20, 0.06);
}

.custom-drawer__submit {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 88rpx;
  margin-top: 48rpx;
  font-size: 28rpx;
  font-weight: 900;
  color: #1f1b14;
  background: var(--tx-color-primary);
  border: 0;
  border-radius: 999rpx;
  line-height: 88rpx;

  &::after {
    border: 0;
  }
}

/* 规则说明内容区 */
.rules-content {
  display: flex;
  flex-direction: column;
  gap: 36rpx;
}

.rule-section {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.rule-section__header {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.rule-section__icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46rpx;
  height: 46rpx;
  border-radius: 12rpx;

  &--green {
    background: rgba(47, 143, 76, 0.1);
  }
  &--orange {
    background: rgba(185, 130, 0, 0.1);
  }
}

.rule-section__title {
  font-size: 28rpx;
  font-weight: 900;
  color: #1f1b14;
}

.rule-list {
  display: flex;
  flex-direction: column;
  background: #fdfcf9;
  border: 1rpx solid rgba(31, 27, 20, 0.05);
  border-radius: 18rpx;
  padding: 12rpx 24rpx;
}

.rule-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18rpx 0;
  border-bottom: 1rpx solid rgba(31, 27, 20, 0.03);

  &:last-child {
    border-bottom: 0;
  }
}

.rule-row__label {
  font-size: 24rpx;
  font-weight: 800;
  color: #5c544a;
}

.rule-row__value {
  font-size: 24rpx;
  font-weight: 900;
  color: #9b7621;
}
</style>
