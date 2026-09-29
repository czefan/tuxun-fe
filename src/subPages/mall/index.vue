<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import TabHeader from '@/components/tab-header/tab-header.vue'
import GoodsGridTab from '@/features/mall/components/goods-grid-tab.vue'
import ExchangeRecordTab from '@/features/mall/components/exchange-record-tab.vue'
import VerifyCodeQr from '@/features/mall/components/verify-code-qr.vue'
import GoodDetailPopup from '@/features/mall/components/good-detail-popup.vue'
import { useExchangeGood } from '@/features/mall/query'
import type { ExchangeRecordVM, GoodsVM } from '@/features/mall/types'
import { useUserStore } from '@/features/user/store/user'
import { useAuth } from '@/features/user/composables/use-auth'
import { debounce } from '@/utils/debounce'

definePage({
  style: {
    navigationBarTitleText: '%page.mall%',
    enablePullDownRefresh: true,
  },
})

const { isLoggedIn, loginDirectly, requireLogin } = useAuth()
const userStore = useUserStore()

const tabOptions = ['积分商城', '兑换记录'] as const
type TabOption = (typeof tabOptions)[number]
const activeTab = ref<TabOption>('积分商城')
const currentTabIndex = computed(() => tabOptions.indexOf(activeTab.value))

const goodsGridRef = ref<InstanceType<typeof GoodsGridTab> | null>(null)
const exchangeRecordRef = ref<InstanceType<typeof ExchangeRecordTab> | null>(null)

const searchKeyword = ref('')
const debouncedKeyword = ref('')
const setKeyword = debounce((val: string) => {
  debouncedKeyword.value = val
}, 300)
watch(searchKeyword, (value) => {
  setKeyword.cancel()
  if (value.trim()) setKeyword(value)
  else debouncedKeyword.value = ''
})
onUnmounted(() => setKeyword.cancel())

const showSearchInput = ref(false)

watch(activeTab, () => {
  showSearchInput.value = false
  searchKeyword.value = ''
  debouncedKeyword.value = ''
})

onShow(() => {
  if (activeTab.value === '积分商城') {
    goodsGridRef.value?.refetch()
  } else if (isLoggedIn()) {
    exchangeRecordRef.value?.refetch()
  }
})

const activeGood = ref<GoodsVM | null>(null)
const goodDetailVisible = ref(false)
const activeRecord = ref<ExchangeRecordVM | null>(null)
const qrModalVisible = ref(false)

function openGoodDetail(good: GoodsVM) {
  activeGood.value = good
  goodDetailVisible.value = true
}

function handleGoodsUpdated(list: GoodsVM[]) {
  if (activeGood.value) {
    const fresh = list.find((g) => g.id === activeGood.value?.id)
    if (fresh) {
      activeGood.value = fresh
    }
  }
}

function openQrModal(record: ExchangeRecordVM) {
  if (record.status !== 'pending') return
  activeRecord.value = record
  qrModalVisible.value = true
}

const exchangeMutation = useExchangeGood()

function handleExchange({ goodId, quantity }: { goodId: number; quantity: number }) {
  if (exchangeMutation.isPending.value) return
  if (!requireLogin()) {
    return
  }
  const idempotencyKey = `ex-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  exchangeMutation.mutate(
    { goodId, quantity, idempotencyKey },
    {
      onSuccess: () => {
        goodDetailVisible.value = false
        uni.showToast({ title: '兑换成功！', icon: 'success' })
      },
    },
  )
}
</script>

<template>
  <view class="page-mall swiper-page bg-tx-main px-3 pt-3">
    <!-- 融入页面的顶栏 Seamless Sub Tab 切换器 -->
    <TabHeader v-model="activeTab" :options="tabOptions">
      <template #actions="{ active }">
        <view class="flex items-center gap-2.5">
          <template v-if="active === '积分商城'">
            <view
              class="h-7 w-7 flex cursor-pointer items-center justify-center rounded-full transition-all active:scale-90"
              :class="
                showSearchInput
                  ? 'bg-tx-brown text-white shadow-2xs'
                  : 'text-tx-ink-2 hover:text-tx-ink'
              "
              @tap="showSearchInput = !showSearchInput"
            >
              <text class="i-carbon-search text-base" />
            </view>
            <view class="h-3 w-[1px] bg-tx-border/60" />
          </template>
          <view class="flex items-center gap-1">
            <text class="i-my-icons-points text-base text-tx-brown" />
            <text class="text-lg text-tx-ink font-bold font-numeric">
              {{ userStore.userInfo?.points ?? 0 }}
            </text>
          </view>
        </view>
      </template>
    </TabHeader>

    <!-- 下拉展开的搜索框容器（自动聚焦光标） -->
    <view
      v-if="activeTab === '积分商城' && showSearchInput"
      class="w-full border-b border-tx-border/50 pb-2 pt-2"
    >
      <wd-search
        v-model="searchKeyword"
        :focus="true"
        placeholder="搜索商品名称或描述..."
        hide-cancel
        custom-class="tx-search"
        placeholder-left
        @clear="searchKeyword = ''"
      />
    </view>

    <!-- 支持左右平滑连贯拖拽滑屏的 Swiper 容器 -->
    <swiper
      class="box-border min-h-0 w-[calc(100%+24px)] flex-1 -mx-3"
      :current="currentTabIndex"
      :duration="300"
      @change="(e: any) => (activeTab = tabOptions[e.detail.current])"
    >
      <!-- 面板 1：积分商城商品网格 -->
      <swiper-item class="box-border">
        <GoodsGridTab
          ref="goodsGridRef"
          :keyword="debouncedKeyword"
          :active="activeTab === '积分商城'"
          @select-good="openGoodDetail"
          @update:goods="handleGoodsUpdated"
        />
      </swiper-item>

      <!-- 面板 2：兑换记录列表 -->
      <swiper-item class="box-border">
        <ExchangeRecordTab
          ref="exchangeRecordRef"
          :active="activeTab === '兑换记录'"
          @select-record="openQrModal"
          @login="loginDirectly"
        />
      </swiper-item>
    </swiper>

    <!-- 商品详情与兑换弹窗 -->
    <GoodDetailPopup
      v-model:visible="goodDetailVisible"
      :good="activeGood"
      :user-points="userStore.userInfo?.points"
      :is-logged-in="isLoggedIn()"
      :is-pending="exchangeMutation.isPending.value"
      @require-login="requireLogin"
      @exchange="handleExchange"
      @close="goodDetailVisible = false"
    />

    <!-- 二维码核销弹窗 -->
    <wd-popup
      v-model="qrModalVisible"
      position="center"
      custom-style="background: transparent; width: 85vw; max-width: 600rpx; margin: 0 auto;"
      @close="qrModalVisible = false"
    >
      <VerifyCodeQr
        v-if="activeRecord"
        :verify-code="activeRecord.verifyCode"
        :good-name="activeRecord.good.name"
        class="w-full flex justify-center"
        @close="qrModalVisible = false"
      />
    </wd-popup>
  </view>
</template>
