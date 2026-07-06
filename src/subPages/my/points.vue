<template>
  <view class="page-profile-sub safe-bottom-page bg-[#f5f5f5] p-[34rpx_24rpx_0]">
    <view class="relative rounded-30rpx bg-[#332d24] p-34rpx">
      <view class="absolute right-30rpx top-30rpx flex cursor-pointer items-center gap-8rpx border border-[#f5c542]/20 rounded-full border-solid bg-white/8 p-[8rpx_16rpx] active:opacity-86" @tap="openRules">
        <wd-icon name="question-circle" :color="BRAND_PRIMARY_COLOR" size="26rpx" />
        <text class="text-22rpx text-brand font-700">积分规则</text>
      </view>
      <text class="block text-26rpx text-brand">当前总积分</text>
      <text class="mt-10rpx block text-60rpx text-white font-900">{{ scoreValue }}</text>
    </view>

    <view class="mt-24rpx">
      <view v-for="item in ledgerList" :key="item.id" class="flex gap-22rpx border-0 border-b border-[#e8e8e8] border-solid py-26rpx">
        <text class="block w-110rpx text-34rpx text-[#d4a017] font-900" :class="{ 'text-[#ff4d4f]': item.score < 0 }">
          {{ item.score > 0 ? `+${item.score}` : item.score }}
        </text>
        <view class="flex-1">
          <text class="block text-30rpx text-[#1f1b14] font-800">{{ item.title }}</text>
          <text class="mt-8rpx block text-24rpx text-[#999999]">{{ item.time }}</text>
        </view>
      </view>
      <view v-if="!ledgerList.length" class="py-80rpx">
        <wd-empty icon="no-content" :tip="ledgerEmptyText" />
      </view>
    </view>

    <!-- 积分规则自定义底部抽屉 -->
    <view v-if="rulesVisible" class="fixed inset-0 bottom-[-1px] z-999 flex items-end bg-[#1f1b14]/48" @tap="closeRules">
      <view class="box-border w-full rounded-[30rpx_30rpx_0_0] bg-white p-[40rpx_36rpx_calc(40rpx+env(safe-area-inset-bottom))] animate-slide-up" @tap.stop>
        <view class="relative flex items-center justify-between">
          <text class="text-32rpx text-[#1f1b14] font-900">积分规则说明</text>
          <view class="h-44rpx w-44rpx flex cursor-pointer items-center justify-center text-36rpx text-[#c8c1b8] font-300" @tap="closeRules">
            ×
          </view>
        </view>

        <view class="my-32rpx h-1rpx bg-[#1f1b14]/6" />

        <view class="flex flex-col gap-36rpx">
          <!-- 积分获取 -->
          <view class="flex flex-col gap-16rpx">
            <view class="flex items-center gap-14rpx">
              <view class="h-46rpx w-46rpx flex items-center justify-center rounded-[12rpx] bg-[#2f8f4c]/10">
                <wd-icon name="plus-circle" color="#2f8f4c" size="28rpx" />
              </view>
              <text class="text-28rpx text-[#1f1b14] font-900">如何获取积分</text>
            </view>
            <view class="flex flex-col border border-[#1f1b14]/5 rounded-18rpx border-solid bg-[#fdfcf9] px-24rpx py-12rpx">
              <view class="flex items-center justify-between border-0 border-b border-[#1f1b14]/3 border-solid py-18rpx">
                <text class="text-24rpx text-[#5c544a] font-800">作答正确</text>
                <text class="text-24rpx text-[#9b7621] font-900">+10 积分 / 题</text>
              </view>
              <view class="flex items-center justify-between border-0 border-b border-[#1f1b14]/3 border-solid py-18rpx">
                <text class="text-24rpx text-[#5c544a] font-800">成功投稿且审核通过</text>
                <text class="text-24rpx text-[#9b7621] font-900">+50 积分 / 题</text>
              </view>
              <view class="flex items-center justify-between border-0 border-b border-[#1f1b14]/3 border-solid py-18rpx last:border-b-0">
                <text class="text-24rpx text-[#5c544a] font-800">参与特定活动或限时挑战</text>
                <text class="text-24rpx text-[#9b7621] font-900">以具体活动规则为准</text>
              </view>
            </view>
          </view>

          <!-- 积分消耗 -->
          <view class="flex flex-col gap-16rpx">
            <view class="flex items-center gap-14rpx">
              <view class="h-46rpx w-46rpx flex items-center justify-center rounded-[12rpx] bg-[#b98200]/10">
                <wd-icon name="minus-circle" color="#b98200" size="28rpx" />
              </view>
              <text class="text-28rpx text-[#1f1b14] font-900">积分可以做什么</text>
            </view>
            <view class="flex flex-col border border-[#1f1b14]/5 rounded-18rpx border-solid bg-[#fdfcf9] px-24rpx py-12rpx">
              <view class="flex items-center justify-between border-0 border-b border-[#1f1b14]/3 border-solid py-18rpx">
                <text class="text-24rpx text-[#5c544a] font-800">积分商城兑换</text>
                <text class="text-24rpx text-[#9b7621] font-900">可用于兑换限量周边及活动礼品</text>
              </view>
              <view class="flex items-center justify-between border-0 border-b border-[#1f1b14]/3 border-solid py-18rpx last:border-b-0">
                <text class="text-24rpx text-[#5c544a] font-800">专属挑战入场券</text>
                <text class="text-24rpx text-[#9b7621] font-900">部分高级挑战模式可能需要消耗积分</text>
              </view>
            </view>
          </view>
        </view>

        <button class="mt-48rpx h-88rpx w-full flex items-center justify-center border-0 rounded-full bg-brand p-0 text-28rpx text-[#1f1b14] font-900 leading-88rpx after:border-0" @tap="closeRules">
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
