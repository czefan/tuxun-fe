<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import StatusTabSwiper from '@/components/status-tab-swiper/status-tab-swiper.vue'
import GoodsGridTab from '@/features/mall/components/goods-grid-tab.vue'
import ExchangeRecordTab from '@/features/mall/components/exchange-record-tab.vue'
import VerifyCodeQr from '@/features/mall/components/verify-code-qr.vue'
import GoodDetailPopup from '@/features/mall/components/good-detail-popup.vue'
import { useExchangeGood } from '@/features/mall/query'
import type { ExchangeRecordVM, GoodsVM } from '@/features/mall/types'
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
const userStore = useUserStore()

const tabOptions = ['积分商城', '兑换记录'] as const
type TabOption = (typeof tabOptions)[number]
const activeTab = ref<TabOption>('积分商城')

const goodsGridRef = ref<InstanceType<typeof GoodsGridTab> | null>(null)
const exchangeRecordRef = ref<InstanceType<typeof ExchangeRecordTab> | null>(null)

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

const exchangeMutation = useExchangeGood()

onShow(() => {
  if (activeTab.value === '积分商城') {
    goodsGridRef.value?.refetch()
  } else if (isLoggedIn()) {
    exchangeRecordRef.value?.refetch()
  }
})

const activeRecord = ref<ExchangeRecordVM | null>(null)
const qrModalVisible = ref(false)
const activeGood = ref<GoodsVM | null>(null)
const goodDetailVisible = ref(false)

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

function openGoodDetail(good: GoodsVM) {
  activeGood.value = good
  goodDetailVisible.value = true
}

function handleExchange({ goodId, quantity }: { goodId: number; quantity: number }) {
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
    <StatusTabSwiper v-model="activeTab" :options="tabOptions">
      <!-- 右侧：仅在积分商城 Tab 显示搜索图标按钮 + 竖向分割线 + 总积分展示 -->
      <template #actions="{ active }">
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
            <text class="i-carbon:search text-base" />
          </view>
          <view class="h-3 w-[1px] bg-tx-border/60" />
        </template>
        <view class="flex items-center gap-1">
          <text class="i-my-icons-points text-base text-tx-brown" />
          <text class="text-lg text-tx-ink font-bold font-numeric">
            {{ userStore.userInfo?.points ?? 0 }}
          </text>
        </view>
      </template>

      <!-- 下拉展开的搜索框容器（自动聚焦光标） -->
      <template #extra>
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
      </template>

      <!-- 面板 1：积分商城商品网格；面板 2：兑换记录列表 -->
      <template #panel="{ option, active }">
        <GoodsGridTab
          v-if="option === '积分商城'"
          ref="goodsGridRef"
          :keyword="debouncedKeyword"
          :active="active"
          @select-good="openGoodDetail"
          @update:goods="handleGoodsUpdated"
        />
        <ExchangeRecordTab
          v-else-if="option === '兑换记录'"
          ref="exchangeRecordRef"
          :active="active"
          @select-record="openQrModal"
          @login="loginDirectly"
        />
      </template>
    </StatusTabSwiper>

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
