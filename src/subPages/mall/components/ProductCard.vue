<template>
  <view class="mall-card">
    <view class="mall-card__cover" :style="coverStyle">
      <image
        class="mall-card__image"
        :src="product.cover"
        lazy-load
        mode="aspectFill"
        @tap.stop="$emit('preview', product.cover)"
      />
      <text v-if="product.badge" class="mall-card__badge">{{ product.badge }}</text>
    </view>
    <view class="mall-card__body">
      <text class="mall-card__title">{{ product.title }}</text>
      <text class="mall-card__desc">{{ product.desc }}</text>
      <view class="mall-card__meta">
        <text class="mall-card__points">{{ product.points }} 积分</text>
        <text class="mall-card__stock">{{ product.stockText }}</text>
      </view>
      <button
        class="mall-card__exchange"
        :class="{ 'mall-card__exchange--disabled': !canExchange }"
        :disabled="!canExchange"
        @tap.stop="$emit('exchange', product)"
      >
        {{ exchangeButtonText }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { canExchangeProduct, getExchangeButtonText } from '../features'
import type { ProductItem } from '../features'

const props = defineProps<{
  product: ProductItem
}>()

defineEmits<{
  preview: [cover: string]
  exchange: [product: ProductItem]
}>()

const canExchange = computed(() => canExchangeProduct(props.product))
const exchangeButtonText = computed(() => getExchangeButtonText(props.product))
const coverStyle = computed(() => ({
  paddingBottom: `${(props.product.coverHeight / props.product.coverWidth) * 100}%`,
}))
</script>

<style scoped lang="scss">
.mall-card {
  overflow: hidden;
  margin-bottom: 10rpx;
  background: #ffffff;
  border-radius: 12rpx;
  box-shadow: 0 10rpx 28rpx rgba(31, 26, 18, 0.06);
}

.mall-card__cover {
  position: relative;
  overflow: hidden;
  background: #eee6d6;
}

.mall-card__image {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}

.mall-card__badge,
.mall-card__title,
.mall-card__desc,
.mall-card__points,
.mall-card__stock {
  display: block;
}

.mall-card__badge {
  position: absolute;
  top: 12rpx;
  left: 12rpx;
  padding: 6rpx 10rpx;
  font-size: 20rpx;
  font-weight: 800;
  color: #1f1b14;
  background: var(--tx-color-primary);
  border-radius: 999rpx;
}

.mall-card__body {
  padding: 10rpx 12rpx 12rpx;
}

.mall-card__title {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  overflow: hidden;
  font-size: 24rpx;
  font-weight: 900;
  line-height: 1.28;
  color: #1f1b14;
  text-overflow: ellipsis;
}

.mall-card__desc {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  overflow: hidden;
  margin-top: 5rpx;
  font-size: 20rpx;
  line-height: 1.3;
  color: #746b60;
  text-overflow: ellipsis;
}

.mall-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8rpx;
  margin-top: 9rpx;
}

.mall-card__points {
  font-size: 22rpx;
  font-weight: 900;
  color: #b98200;
}

.mall-card__stock {
  overflow: hidden;
  font-size: 18rpx;
  color: #999999;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mall-card__exchange {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 46rpx;
  margin: 10rpx 0 0;
  padding: 0;
  font-size: 22rpx;
  font-weight: 900;
  line-height: 46rpx;
  color: #1f1b14;
  background: var(--tx-color-primary);
  border: 0;
  border-radius: 999rpx;
}

.mall-card__exchange::after {
  border: 0;
}

.mall-card__exchange--disabled {
  color: #8a8175;
  background: #ece7dc;
}
</style>
