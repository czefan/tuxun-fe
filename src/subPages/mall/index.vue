<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { useExchangeGood, useInfiniteExchangeList, useInfiniteGoodsList } from '@/features/mall/query'
import type { ExchangeRecordVM, GoodsVM } from '@/features/mall/types'
import VerifyCodeQr from '@/features/mall/components/verify-code-qr.vue'
import { useUserStore } from '@/features/user'
import { useAuth } from '@/features/user/composables/use-auth'
import { debounce } from '@/utils/debounce'

definePage({
  style: {
    navigationBarTitleText: '%page.mall%',
    enablePullDownRefresh: true,
  },
})

const { isLoggedIn, loginDirectly, requireLogin } = useAuth()

const activeTab = ref('积分商城')
const tabOptions = ['积分商城', '兑换记录']
const currentTabIndex = computed(() => tabOptions.indexOf(activeTab.value))
const userStore = useUserStore()

const searchKeyword = ref('')
const debouncedKeyword = ref('')
const setKeyword = debounce((val: string) => {
  debouncedKeyword.value = val
}, 300)
watch(searchKeyword, setKeyword)
onUnmounted(() => setKeyword.cancel())
const showSearchInput = ref(false)

watch(activeTab, () => {
  showSearchInput.value = false
  searchKeyword.value = ''
  debouncedKeyword.value = ''
})

const { data: goodsData, isPending: goodsLoading, fetchNextPage: fetchNextGoods, hasNextPage: hasNextGoods, isFetchingNextPage: isFetchingGoods, refetch: refetchGoods } = useInfiniteGoodsList(computed(() => ({
  keyword: debouncedKeyword.value.trim() || undefined,
})))
const { data: exchangeData, isPending: exchangeLoading, fetchNextPage: fetchNextExchanges, hasNextPage: hasNextExchanges, isFetchingNextPage: isFetchingExchanges, refetch: refetchExchanges } = useInfiniteExchangeList()
const exchangeMutation = useExchangeGood()

const goodsList = computed<GoodsVM[]>(() => goodsData.value?.pages.flatMap(p => p.list) ?? [])
const exchangeList = computed<ExchangeRecordVM[]>(() => exchangeData.value?.pages.flatMap(p => p.list) ?? [])

onReachBottom(() => {
  if (activeTab.value === '积分商城') {
    if (hasNextGoods?.value && !isFetchingGoods.value)
      fetchNextGoods()
  }
  else {
    if (hasNextExchanges?.value && !isFetchingExchanges.value)
      fetchNextExchanges()
  }
})

onPullDownRefresh(async () => {
  if (activeTab.value === '积分商城') {
    await refetchGoods()
  }
  else {
    await refetchExchanges()
  }
  uni.stopPullDownRefresh()
})

const activeRecord = ref<ExchangeRecordVM | null>(null)
const qrModalVisible = ref(false)
const activeGood = ref<GoodsVM | null>(null)
const goodDetailVisible = ref(false)

const exchangeCount = ref(1)
const exchangeInputStr = ref('1')

function openQrModal(record: ExchangeRecordVM) {
  if (record.status !== 'pending')
    return
  activeRecord.value = record
  qrModalVisible.value = true
}

function openGoodDetail(good: GoodsVM) {
  activeGood.value = good
  exchangeCount.value = 1
  exchangeInputStr.value = '1'
  goodDetailVisible.value = true
}

function handleCountInput(e: any) {
  const valStr = e.detail?.value ?? e.target?.value ?? ''
  let num = parseInt(valStr, 10)
  if (isNaN(num)) {
    exchangeInputStr.value = ''
    return
  }
  if (activeGood.value && num > activeGood.value.stock) {
    num = activeGood.value.stock
    uni.showToast({ title: `最多可兑换 ${activeGood.value.stock} 件`, icon: 'none' })
  }
  if (num < 1)
    num = 1
  exchangeCount.value = num
  exchangeInputStr.value = String(num)
}

function handleCountBlur() {
  if (!exchangeCount.value || exchangeCount.value < 1) {
    exchangeCount.value = 1
    exchangeInputStr.value = '1'
  }
  else if (activeGood.value && exchangeCount.value > activeGood.value.stock) {
    exchangeCount.value = activeGood.value.stock
    exchangeInputStr.value = String(activeGood.value.stock)
  }
}

function decreaseCount() {
  if (exchangeCount.value > 1) {
    exchangeCount.value--
    exchangeInputStr.value = String(exchangeCount.value)
  }
}

function increaseCount() {
  if (activeGood.value && exchangeCount.value < activeGood.value.stock) {
    exchangeCount.value++
    exchangeInputStr.value = String(exchangeCount.value)
  }
  else if (activeGood.value) {
    uni.showToast({ title: `最多可兑换 ${activeGood.value.stock} 件`, icon: 'none' })
  }
}

function handleExchange(goodId: number) {
  if (!requireLogin())
    return

  if (!activeGood.value)
    return

  const totalScore = activeGood.value.scorePrice * exchangeCount.value
  const goodName = activeGood.value.name
  const count = exchangeCount.value

  uni.showModal({
    title: '确认兑换商品？',
    content: `将消耗 ${totalScore} 积分兑换 ${count} 件“${goodName}”，确认继续？`,
    confirmText: '确认兑换',
    cancelText: '取消',
    confirmColor: '#B69171',
    success: (res) => {
      if (res.confirm) {
        const idempotencyKey = `ex-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        exchangeMutation.mutate({ goodId, quantity: count, idempotencyKey }, {
          onSuccess: () => {
            goodDetailVisible.value = false
            uni.showToast({ title: '兑换成功！', icon: 'success' })
          },
        })
      }
    },
  })
}
</script>

<template>
  <view class="page-mall swiper-page bg-[#F1DFC5] px-3 pt-3">
    <!-- 融入页面的顶栏 Seamless Sub Tab 切换器 -->
    <view class="flex flex-shrink-0 items-end justify-between px-1 pb-0" style="border-bottom: 1px solid rgba(211, 186, 159, 0.5);">
      <view class="flex items-center gap-6">
        <view
          v-for="opt in tabOptions"
          :key="opt"
          class="relative cursor-pointer pb-2.5 text-base transition-all active:scale-95"
          :class="activeTab === opt ? 'text-[#1E1E1E] font-black' : 'text-[#8A7E70] font-bold'"
          @tap="activeTab = opt"
        >
          <text>{{ opt }}</text>
          <view
            v-if="activeTab === opt"
            class="absolute left-0 right-0 h-[2.5px] rounded-full bg-[#B69171] -bottom-[1px]"
          />
        </view>
      </view>

      <!-- 右侧：仅在积分商城 Tab 显示搜索图标按钮 + 竖向分割线 + 总积分展示 -->
      <view class="flex items-center gap-2.5 pb-2.5">
        <template v-if="activeTab === '积分商城'">
          <view
            class="h-7 w-7 flex cursor-pointer items-center justify-center rounded-full transition-all active:scale-90"
            :class="showSearchInput ? 'bg-[#B69171] text-white shadow-2xs' : 'text-[#756C5E] hover:text-[#1E1E1E]'"
            @tap="showSearchInput = !showSearchInput"
          >
            <text class="i-carbon:search text-base" />
          </view>
          <view class="h-3 w-[1px] bg-[#D3BA9F]/60" />
        </template>
        <view class="flex items-center gap-1">
          <text class="i-my-icons-points text-base text-[#B69171]" />
          <text class="font-num text-lg text-[#1E1E1E] font-bold">{{ userStore.userInfo?.points ?? 0 }}</text>
        </view>
      </view>
    </view>

    <!-- 下拉展开的搜索框容器（自动聚焦光标） -->
    <view v-if="activeTab === '积分商城' && showSearchInput" class="w-full border-b border-[#D3BA9F]/50 pb-2 pt-2">
      <wd-search
        v-model="searchKeyword"
        :focus="true"
        placeholder="搜索商品名称..."
        hide-cancel
        custom-class="tx-search"
        placeholder-left
        @clear="searchKeyword = ''"
      />
    </view>

    <!-- 支持左右连贯手势滑屏的 Swiper 容器 -->
    <swiper
      class="box-border min-h-0 w-[calc(100%+24px)] flex-1 -mx-3"
      :current="currentTabIndex"
      :duration="300"
      @change="(e) => activeTab = tabOptions[e.detail.current]"
    >
      <!-- 滑块 1：积分商城 -->
      <swiper-item class="box-border">
        <scroll-view scroll-y :show-scrollbar="false" class="hide-scrollbar box-border h-full w-full" @scrolltolower="() => fetchNextGoods()">
          <view class="bottom-space px-3 pt-2.5 space-y-3">
            <view v-if="goodsLoading" class="grid grid-cols-2 gap-2.5">
              <wd-skeleton animation="gradient" :row-col="[{ width: '100%', height: '180px' }]" />
              <wd-skeleton animation="gradient" :row-col="[{ width: '100%', height: '180px' }]" />
            </view>
            <view v-else-if="goodsList.length" class="grid grid-cols-2 gap-2.5">
              <!-- 干净相纸卡片 (包含大图、商品名称、所需积分与库存数量) -->
              <view
                v-for="item in goodsList"
                :key="item.id"
                class="shadow-2xs flex flex-col cursor-pointer justify-between overflow-hidden border border-[#D3BA9F]/60 rounded-lg bg-white transition-all active:scale-[0.98]"
                @tap="openGoodDetail(item)"
              >
                <view class="aspect-square w-full overflow-hidden bg-[#B69171]/10">
                  <wd-img custom-class="h-full w-full object-cover" lazy-load :src="item.image.url" mode="aspectFill" width="100%" height="100%" />
                </view>
                <view class="flex flex-1 flex-col justify-between p-2.5 space-y-1">
                  <text class="line-clamp-2 block min-h-[2.6em] text-sm text-[#1E1E1E] font-medium leading-snug">{{ item.name }}</text>
                  <view class="flex items-center justify-between pt-0.5">
                    <view class="flex items-center gap-0.5">
                      <text class="i-my-icons-points text-xs text-[#B69171]" />
                      <text class="font-num text-xs text-[#B69171] font-bold">{{ item.scorePrice }}</text>
                    </view>
                    <text class="text-xs text-[#756C5E] font-medium">库存: {{ item.stock }}</text>
                  </view>
                </view>
              </view>
            </view>
            <view v-else class="py-20">
              <wd-empty icon="no-result" tip="暂无上架商品" />
            </view>
            <wd-loadmore v-if="isFetchingGoods" :state="isFetchingGoods ? 'loading' : undefined" @reload="fetchNextGoods" />
          </view>
        </scroll-view>
      </swiper-item>

      <!-- 滑块 2：兑换记录 -->
      <swiper-item class="box-border">
        <scroll-view scroll-y :show-scrollbar="false" class="hide-scrollbar box-border h-full w-full" @scrolltolower="() => fetchNextExchanges()">
          <view v-if="!isLoggedIn()" class="min-h-full flex flex-col items-center justify-center -mt-6">
            <wd-empty icon="no-result" tip="登录后查看兑换记录" />
            <wd-button size="small" round type="warning" custom-class="!mt-4 !font-bold shadow-md" @click="loginDirectly">
              去登录
            </wd-button>
          </view>
          <view v-else class="bottom-space px-3 pt-2.5 space-y-3">
            <view v-if="exchangeLoading" class="space-y-3">
              <wd-skeleton animation="gradient" :row-col="[{ width: '100%', height: '70px' }, { width: '100%', height: '70px' }]" />
            </view>
            <view v-else-if="exchangeList.length" class="space-y-3">
              <view
                v-for="item in exchangeList"
                :key="item.id"
                class="shadow-2xs min-h-[80px] flex items-stretch justify-between overflow-hidden border border-[#D3BA9F]/60 rounded-lg bg-white transition-all"
                :class="item.status === 'pending' ? 'cursor-pointer active:scale-[0.99]' : 'opacity-85'"
                @tap="openQrModal(item)"
              >
                <!-- 左侧图片：完全撑满卡片上下高度，零四周留白 -->
                <view class="w-20 flex-shrink-0 self-stretch bg-[#B69171]/10">
                  <wd-img custom-class="h-full w-full object-cover" lazy-load :src="item.good.image.url" mode="aspectFill" width="80px" height="100%" />
                </view>

                <!-- 中间说明区：上下顶底分布并带有恰当内缩边距 -->
                <view class="min-w-0 flex flex-1 flex-col self-stretch justify-between py-2 pl-5 pr-1.5">
                  <text class="line-clamp-2 block text-sm text-[#1E1E1E] font-bold leading-snug">{{ item.good.name }}</text>
                  <view class="flex items-center justify-between gap-1">
                    <view class="flex flex-shrink-0 items-center gap-0.5">
                      <text class="i-my-icons-points text-xs text-[#B69171]" />
                      <text class="font-num text-xs text-[#B69171] font-bold">-{{ item.scoreCost }}</text>
                    </view>
                    <text class="truncate u-meta-time">{{ item.exchangeAt || '尚未核销' }}</text>
                  </view>
                </view>

                <!-- 右侧状态 Tag 与二维码 UI 图标 -->
                <view class="flex flex-col items-center self-stretch justify-center py-2 pl-1 pr-2.5 space-y-1">
                  <view
                    v-if="item.status === 'pending'"
                    class="flex items-center justify-center text-[#B69171] transition-transform active:scale-90"
                  >
                    <text class="i-carbon:qr-code text-2xl" />
                  </view>
                  <wd-tag
                    :type="item.status === 'pending' ? 'warning' : (item.status === 'verified' ? 'success' : 'default')"
                    round
                    size="medium"
                    custom-class="!font-bold !text-xs !px-2.5 !py-0.5"
                  >
                    {{ item.status === 'pending' ? '待核销' : (item.status === 'verified' ? '已核销' : '已取消') }}
                  </wd-tag>
                </view>
              </view>
            </view>
            <view v-else class="py-20">
              <wd-empty icon="no-result" tip="暂无兑换记录" />
            </view>
            <wd-loadmore v-if="isFetchingExchanges" :state="isFetchingExchanges ? 'loading' : undefined" @reload="fetchNextExchanges" />
          </view>
        </scroll-view>
      </swiper-item>
    </swiper>

    <!-- 商品详情与兑换弹窗 (展示完整描述、支持手动输入及按钮限制的计数器与兑换计算) -->
    <wd-popup v-model="goodDetailVisible" position="center" custom-style="background: transparent; width: 85vw; max-width: 600rpx; margin: 0 auto;" @close="goodDetailVisible = false">
      <view v-if="activeGood" class="relative mx-auto w-full flex flex-col overflow-hidden border border-[#D3BA9F] rounded-2xl bg-white shadow-2xl">
        <!-- 右上角关闭按钮 -->
        <view
          class="absolute right-3 top-3 z-10 h-7 w-7 flex cursor-pointer items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-transform active:scale-90"
          @tap="goodDetailVisible = false"
        >
          <wd-icon name="close" size="16px" />
        </view>
        <wd-img custom-class="h-48 w-full bg-[#B69171]/10 object-cover" lazy-load :src="activeGood.image.originUrl" mode="aspectFill" width="100%" height="384rpx" />
        <view class="p-5 space-y-4">
          <view class="flex items-baseline justify-between gap-3">
            <text class="min-w-0 flex-1 text-base text-[#1E1E1E] font-bold leading-snug">{{ activeGood.name }}</text>
            <text class="flex-shrink-0 whitespace-nowrap text-xs text-[#756C5E] font-mono">库存: {{ activeGood.stock }}</text>
          </view>

          <text class="block text-sm text-[#555555] leading-relaxed">{{ activeGood.description }}</text>

          <!-- 数量选择器（支持点击 - / + 以及直接键盘手动输入数字，自动限制不超过库存） -->
          <view class="flex items-center justify-between border-t border-[#D3BA9F]/30 pt-3">
            <text class="text-sm text-[#1E1E1E] font-bold">兑换数量</text>
            <view class="flex items-center gap-2">
              <view
                class="h-7 w-7 flex cursor-pointer items-center justify-center border border-[#D3BA9F] rounded-lg bg-stone-100 text-[#1E1E1E] active:scale-90"
                :class="exchangeCount <= 1 ? 'opacity-40 cursor-not-allowed' : ''"
                @tap="decreaseCount"
              >
                <text class="text-base font-bold">-</text>
              </view>
              <input
                v-model="exchangeInputStr"
                type="number"
                class="font-num h-7 w-12 border border-[#D3BA9F]/60 rounded-md bg-stone-50 py-0.5 text-center text-sm text-[#1E1E1E] font-bold"
                @input="handleCountInput"
                @blur="handleCountBlur"
              >
              <view
                class="h-7 w-7 flex cursor-pointer items-center justify-center border border-[#D3BA9F] rounded-lg bg-stone-100 text-[#1E1E1E] active:scale-90"
                :class="exchangeCount >= activeGood.stock ? 'opacity-40 cursor-not-allowed' : ''"
                @tap="increaseCount"
              >
                <text class="text-base font-bold">+</text>
              </view>
            </view>
          </view>

          <!-- 底部确认与积分统计 -->
          <view class="flex items-center justify-between border-t border-[#D3BA9F]/30 pt-3">
            <view class="flex flex-col">
              <text class="text-xs text-[#756C5E]">合计积分</text>
              <view class="flex items-center gap-0.5">
                <text class="i-my-icons-points text-sm text-[#B69171]" />
                <text class="font-num text-base text-[#B69171] font-bold">{{ activeGood.scorePrice * exchangeCount }}</text>
              </view>
            </view>
            <wd-button type="warning" round size="medium" custom-class="!font-bold !bg-[#F9DF95] !text-[#1E1E1E] shadow-xs" :disabled="activeGood.stock <= 0 || exchangeMutation.isPending.value" @click="handleExchange(activeGood.id)">
              {{ activeGood.stock > 0 ? '确认兑换' : '暂时缺货' }}
            </wd-button>
          </view>
        </view>
      </view>
    </wd-popup>

    <!-- 二维码核销弹窗 -->
    <wd-popup v-model="qrModalVisible" position="center" custom-style="background: transparent; width: 85vw; max-width: 600rpx; margin: 0 auto;" @close="qrModalVisible = false">
      <VerifyCodeQr v-if="activeRecord" :verify-code="activeRecord.verifyCode" :good-name="activeRecord.good.name" class="w-full flex justify-center" @close="qrModalVisible = false" />
    </wd-popup>
  </view>
</template>
