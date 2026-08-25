<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { GoodsVM } from '../types'
import { TX_BG_BROWN } from '@/styles/constants'

const props = defineProps<{
  good: GoodsVM | null
  userPoints?: number | null
  isLoggedIn: boolean
  isPending?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'requireLogin'): boolean
  (e: 'exchange', payload: { goodId: number; quantity: number }): void
}>()

const visible = defineModel<boolean>('visible', { default: false })

const exchangeCount = ref(1)
const exchangeInputStr = ref('1')

// 监听 good 变化重置或限制数量
watch(
  () => props.good,
  (fresh) => {
    if (fresh) {
      if (exchangeCount.value > fresh.stock) {
        exchangeCount.value = Math.max(1, fresh.stock)
        exchangeInputStr.value = String(exchangeCount.value)
      }
    } else {
      exchangeCount.value = 1
      exchangeInputStr.value = '1'
    }
  },
)

watch(visible, (val) => {
  if (val) {
    exchangeCount.value = 1
    exchangeInputStr.value = '1'
  }
})

const totalExchangeScore = computed(() => (props.good?.scorePrice ?? 0) * exchangeCount.value)
const isPointsInsufficient = computed(() => {
  if (!props.isLoggedIn || props.userPoints == null) {
    return false
  }
  return props.userPoints < totalExchangeScore.value
})

function setExchangeCount(val: number) {
  const max = props.good?.stock ?? 1
  if (val > max) {
    uni.showToast({ title: `最多可兑换 ${max} 件`, icon: 'none' })
  }
  const count = Math.max(1, Math.min(val, max))
  exchangeCount.value = count
  exchangeInputStr.value = String(count)
}

function handleConfirmExchange() {
  if (!props.good) return

  if (!props.isLoggedIn) {
    emit('requireLogin')
    return
  }

  if (isPointsInsufficient.value) {
    uni.showToast({ title: '积分不足，无法兑换', icon: 'none' })
    return
  }

  const totalScore = totalExchangeScore.value
  const goodName = props.good.name
  const count = exchangeCount.value
  const goodId = props.good.id

  uni.showModal({
    title: '确认兑换商品？',
    content: `将消耗 ${totalScore} 积分兑换 ${count} 件“${goodName}”，确认继续？`,
    confirmText: '确认兑换',
    cancelText: '取消',
    confirmColor: TX_BG_BROWN,
    success: (res) => {
      if (res.confirm) {
        emit('exchange', { goodId, quantity: count })
      }
    },
  })
}
</script>

<template>
  <wd-popup
    v-model="visible"
    position="center"
    :z-index="999"
    custom-style="background: transparent; width: 85vw; max-width: 600rpx; margin: 0 auto;"
    @close="emit('close')"
  >
    <view
      v-if="good"
      class="relative mx-auto box-border max-h-[82vh] w-full flex flex-col overflow-hidden border border-tx-border rounded-2xl bg-white shadow-2xl"
    >
      <!-- 详情大图用高清原图 -->
      <view
        class="relative w-full flex overflow-hidden bg-tx-brown/10"
        :style="
          good.image?.width && good.image?.height
            ? { aspectRatio: `${good.image.width} / ${good.image.height}` }
            : {}
        "
      >
        <wd-img
          :key="`good-modal-${good.id}`"
          custom-class="w-full !block"
          :custom-style="`display: block; vertical-align: top; width: 100%;${good.image?.width && good.image?.height ? ` aspect-ratio: ${good.image.width} / ${good.image.height};` : ''}`"
          lazy-load
          :src="good.image.originUrl || good.image.url"
          mode="widthFix"
          width="100%"
        />
        <!-- 右上角关闭按钮 -->
        <view
          class="absolute right-3 top-3 z-10 h-7 w-7 flex cursor-pointer items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-transform active:scale-90"
          @tap="visible = false"
        >
          <wd-icon name="close" size="16px" />
        </view>
      </view>

      <!-- 弹窗可滚动内容区 -->
      <view class="min-h-0 flex-1 overflow-y-auto p-5 space-y-4">
        <view class="flex items-baseline justify-between gap-3">
          <text class="min-w-0 flex-1 text-base text-tx-ink font-bold leading-snug">
            {{ good.name }}
          </text>
          <text class="flex-shrink-0 whitespace-nowrap text-xs text-tx-ink-2 font-mono">
            库存: {{ good.stock }}
          </text>
        </view>

        <text class="block text-sm text-[#555555] leading-relaxed">{{ good.description }}</text>

        <!-- 数量选择器（支持点击 - / + 以及直接键盘手动输入数字，自动限制不超过库存） -->
        <view class="flex items-center justify-between border-t border-tx-border/30 pt-3">
          <text class="text-sm text-tx-ink font-bold">兑换数量</text>
          <view class="flex items-center gap-2">
            <view
              class="h-7 w-7 flex cursor-pointer items-center justify-center border border-tx-border rounded-lg bg-stone-100 text-tx-ink active:scale-90"
              :class="exchangeCount <= 1 ? 'opacity-40 cursor-not-allowed' : ''"
              @tap="setExchangeCount(exchangeCount - 1)"
            >
              <text class="text-base font-bold">-</text>
            </view>
            <input
              v-model="exchangeInputStr"
              type="number"
              class="h-7 w-12 border border-tx-border/60 rounded-md bg-stone-50 py-0.5 text-center text-sm text-tx-ink font-bold font-numeric"
              @input="
                (e: any) => {
                  const v = parseInt(e.detail?.value, 10)
                  if (isNaN(v)) exchangeInputStr = ''
                  else setExchangeCount(v)
                }
              "
              @blur="setExchangeCount(parseInt(exchangeInputStr, 10) || 1)"
            />
            <view
              class="h-7 w-7 flex cursor-pointer items-center justify-center border border-tx-border rounded-lg bg-stone-100 text-tx-ink active:scale-90"
              :class="exchangeCount >= good.stock ? 'opacity-40 cursor-not-allowed' : ''"
              @tap="setExchangeCount(exchangeCount + 1)"
            >
              <text class="text-base font-bold">+</text>
            </view>
          </view>
        </view>
        <!-- 底部确认与积分统计 -->
        <view class="flex items-center justify-between border-t border-tx-border/30 pt-3">
          <view class="flex flex-col">
            <text class="text-xs text-tx-ink-2">合计积分</text>
            <view class="flex items-center gap-0.5">
              <text class="i-my-icons-points text-sm text-tx-brown" />
              <text class="text-base text-tx-brown font-bold font-numeric">
                {{ totalExchangeScore }}
              </text>
            </view>
          </view>
          <wd-button
            type="warning"
            round
            size="medium"
            custom-class="!font-bold !bg-tx-accent !text-tx-ink shadow-xs"
            :disabled="good.stock <= 0 || isPointsInsufficient || isPending"
            @click="handleConfirmExchange"
          >
            {{ good.stock <= 0 ? '暂时缺货' : isPointsInsufficient ? '积分不足' : '确认兑换' }}
          </wd-button>
        </view>
      </view>
    </view>
  </wd-popup>
</template>
