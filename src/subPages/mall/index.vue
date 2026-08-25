<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import {
  useExchangeGood,
  useInfiniteExchangeList,
  useInfiniteGoodsList,
} from '@/features/mall/query'
import { useInfiniteListPage } from '@/composables/use-infinite-list-page'
import type { ExchangeRecordVM, GoodsVM } from '@/features/mall/types'
import VerifyCodeQr from '@/features/mall/components/verify-code-qr.vue'
import GoodDetailPopup from '@/features/mall/components/good-detail-popup.vue'
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

const {
  data: goodsData,
  isLoading: goodsLoading,
  isError: goodsError,
  fetchNextPage: fetchNextGoods,
  hasNextPage: hasNextGoods,
  isFetchingNextPage: isFetchingGoods,
  refetch: refetchGoods,
} = useInfiniteGoodsList(
  computed(() => ({
    keyword: debouncedKeyword.value.trim() || undefined,
  })),
)
const {
  data: exchangeData,
  isLoading: exchangeLoading,
  isError: exchangeError,
  fetchNextPage: fetchNextExchanges,
  hasNextPage: hasNextExchanges,
  isFetchingNextPage: isFetchingExchanges,
  refetch: refetchExchanges,
} = useInfiniteExchangeList()
const exchangeMutation = useExchangeGood()

const goodsList = computed<GoodsVM[]>(() => goodsData.value?.pages.flatMap((p) => p.list) ?? [])
const exchangeList = computed<ExchangeRecordVM[]>(
  () => exchangeData.value?.pages.flatMap((p) => p.list) ?? [],
)

onShow(() => {
  if (activeTab.value === '积分商城') {
    refetchGoods()
  } else if (isLoggedIn()) {
    refetchExchanges()
  }
})

useInfiniteListPage({
  hasNextPage: hasNextGoods,
  isFetchingNextPage: isFetchingGoods,
  fetchNextPage: fetchNextGoods,
  refetch: refetchGoods,
  enabled: () => activeTab.value === '积分商城',
})

useInfiniteListPage({
  hasNextPage: hasNextExchanges,
  isFetchingNextPage: isFetchingExchanges,
  fetchNextPage: fetchNextExchanges,
  refetch: refetchExchanges,
  enabled: () => isLoggedIn() && activeTab.value === '兑换记录',
})

const RECORD_STATUS_MAP: Record<string, { text: string; type: 'warning' | 'success' | 'default' }> =
  {
    pending: { text: '待核销', type: 'warning' },
    verified: { text: '已核销', type: 'success' },
    cancelled: { text: '已取消', type: 'default' },
  }

const activeRecord = ref<ExchangeRecordVM | null>(null)
const qrModalVisible = ref(false)
const activeGood = ref<GoodsVM | null>(null)
const goodDetailVisible = ref(false)

// 列表热更新时同步已打开弹层的商品最新库存
watch(goodsList, (list) => {
  if (activeGood.value) {
    const fresh = list.find((g) => g.id === activeGood.value?.id)
    if (fresh) {
      activeGood.value = fresh
    }
  }
})

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
    <!-- 融入页面的顶栏 Seamless Sub Tab 切换器 -->
    <view
      class="flex flex-shrink-0 items-end justify-between px-1 pb-0"
      style="border-bottom: 1px solid rgba(211, 186, 159, 0.5)"
    >
      <view class="flex items-center gap-6">
        <view
          v-for="opt in tabOptions"
          :key="opt"
          class="relative cursor-pointer pb-2.5 text-base transition-all active:scale-95"
          :class="activeTab === opt ? 'text-tx-ink font-black' : 'text-tx-ink-3 font-bold'"
          @tap="activeTab = opt"
        >
          <text>{{ opt }}</text>
          <view
            v-if="activeTab === opt"
            class="absolute left-0 right-0 h-[2.5px] rounded-full bg-tx-brown -bottom-[1px]"
          />
        </view>
      </view>

      <!-- 右侧：仅在积分商城 Tab 显示搜索图标按钮 + 竖向分割线 + 总积分展示 -->
      <view class="flex items-center gap-2.5 pb-2.5">
        <template v-if="activeTab === '积分商城'">
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
      </view>
    </view>

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

    <!-- 可左右滑动的 Swiper 容器 (全屏物理宽度) -->
    <swiper
      class="box-border min-h-0 w-[calc(100%+24px)] flex-1 -mx-3"
      :current="currentTabIndex"
      :duration="300"
      @change="(e) => (activeTab = tabOptions[e.detail.current])"
    >
      <!-- 滑块 1：积分商城列表 -->
      <swiper-item class="box-border">
        <scroll-view
          scroll-y
          :show-scrollbar="false"
          class="hide-scrollbar box-border h-full w-full"
          @scrolltolower="() => fetchNextGoods()"
        >
          <view class="bottom-space--bar px-3 pt-2.5 space-y-4">
            <view v-if="goodsLoading" class="grid grid-cols-2 gap-3">
              <wd-skeleton animation="gradient" :row-col="[{ width: '100%', height: '140px' }]" />
              <wd-skeleton animation="gradient" :row-col="[{ width: '100%', height: '140px' }]" />
            </view>
            <view
              v-else-if="goodsError"
              class="flex flex-col items-center justify-center gap-3 py-20"
            >
              <wd-empty icon="network-error" tip="加载失败，请重试" />
              <wd-button size="small" plain round @click="refetchGoods"> 重新加载 </wd-button>
            </view>
            <!-- 2 列网格布局，干净相纸卡片 (包含大图、商品名称、所需积分与库存数量) -->
            <view v-else-if="goodsList.length" class="grid grid-cols-2 gap-2.5">
              <view
                v-for="item in goodsList"
                :key="item.id"
                class="shadow-2xs flex flex-col cursor-pointer justify-between overflow-hidden border border-tx-border/60 rounded-lg bg-white transition-all active:scale-[0.98]"
                @tap="openGoodDetail(item)"
              >
                <!-- 商品图片 (固定正方形比例，cover 裁剪) -->
                <view class="relative aspect-square w-full overflow-hidden bg-tx-brown/10">
                  <wd-img
                    custom-class="h-full w-full object-cover block"
                    :src="item.image?.originUrl || item.image?.url"
                    mode="aspectFill"
                    lazy-load
                    width="100%"
                    height="100%"
                  />
                  <!-- 库存为 0 售罄遮罩 -->
                  <view
                    v-if="item.stock <= 0"
                    class="absolute inset-0 z-2 flex items-center justify-center bg-black/40 text-white font-bold"
                  >
                    已售罄
                  </view>
                </view>
                <!-- 商品信息区：固定两行高度保持卡片对齐 -->
                <view class="flex flex-1 flex-col justify-between p-2.5 space-y-1">
                  <text
                    class="line-clamp-2 block min-h-[2.6em] text-sm text-tx-ink font-medium leading-snug"
                  >
                    {{ item.name }}
                  </text>
                  <view class="flex items-center justify-between pt-0.5">
                    <!-- 积分图标 + 数字 -->
                    <view class="flex items-center gap-0.5">
                      <text class="i-my-icons-points text-xs text-tx-brown" />
                      <text class="text-xs text-tx-brown font-bold font-numeric">
                        {{ item.scorePrice }}
                      </text>
                    </view>
                    <text class="text-xs text-tx-ink-2 font-medium">库存: {{ item.stock }}</text>
                  </view>
                </view>
              </view>
            </view>
            <view v-else class="py-20">
              <wd-empty icon="no-result" tip="暂无商品" />
            </view>
            <wd-loadmore v-if="isFetchingGoods" state="loading" @reload="fetchNextGoods" />
          </view>
        </scroll-view>
      </swiper-item>

      <!-- 滑块 2：兑换记录列表 -->
      <swiper-item class="box-border">
        <scroll-view
          scroll-y
          :show-scrollbar="false"
          class="hide-scrollbar box-border h-full w-full"
          @scrolltolower="() => fetchNextExchanges()"
        >
          <view
            v-if="!isLoggedIn()"
            class="min-h-full flex flex-col items-center justify-center -mt-6"
          >
            <wd-empty icon="no-result" tip="登录后查看兑换记录" />
            <wd-button
              size="small"
              round
              type="warning"
              custom-class="!mt-4 !font-bold shadow-md"
              @click="loginDirectly"
            >
              去登录
            </wd-button>
          </view>
          <view v-else class="bottom-space--bar px-3 pt-2.5 space-y-3">
            <view v-if="exchangeLoading" class="space-y-3">
              <wd-skeleton
                animation="gradient"
                :row-col="[
                  { width: '100%', height: '70px' },
                  { width: '100%', height: '70px' },
                ]"
              />
            </view>
            <view
              v-else-if="exchangeError"
              class="flex flex-col items-center justify-center gap-3 py-20"
            >
              <wd-empty icon="network-error" tip="加载失败，请重试" />
              <wd-button size="small" plain round @click="refetchExchanges"> 重新加载 </wd-button>
            </view>
            <!-- 兑换记录卡片列表 -->
            <view v-else-if="exchangeList.length" class="space-y-3">
              <view
                v-for="item in exchangeList"
                :key="item.id"
                class="shadow-2xs min-h-[84px] flex items-stretch justify-between overflow-hidden border border-tx-border/60 rounded-xl bg-white transition-all"
                :class="
                  item.status === 'pending' ? 'cursor-pointer active:scale-[0.99]' : 'opacity-85'
                "
                @tap="openQrModal(item)"
              >
                <!-- 左侧图片：84px 正方形通高大图 -->
                <view
                  class="relative min-h-[84px] w-[84px] flex-shrink-0 self-stretch overflow-hidden bg-tx-brown/10"
                >
                  <wd-img
                    custom-class="h-full w-full object-cover block"
                    lazy-load
                    :src="item.good.image?.originUrl || item.good.image?.url"
                    mode="aspectFill"
                    width="100%"
                    height="100%"
                  />
                </view>

                <!-- 中间说明区：上下顶底分布并带有内边距 -->
                <view
                  class="min-w-0 flex flex-1 flex-col self-stretch justify-between py-2.5 pl-3.5 pr-2"
                >
                  <text class="line-clamp-2 block text-sm text-tx-ink font-bold leading-snug">
                    {{ item.good.name }}
                    <text class="ml-1 text-xs text-tx-ink-2 font-medium font-numeric">
                      ×{{ item.quantity }}
                    </text>
                  </text>
                  <view class="flex items-center justify-between gap-1">
                    <view class="flex flex-shrink-0 items-center gap-0.5">
                      <text class="i-my-icons-points text-xs text-tx-brown" />
                      <text class="text-xs text-tx-brown font-bold font-numeric">
                        -{{ item.scoreCost }}
                      </text>
                    </view>
                    <text v-if="item.createdAt" class="truncate text-xs text-tx-ink-2 font-numeric">
                      {{ item.createdAt }}
                    </text>
                  </view>
                </view>

                <!-- 右侧状态 Tag 与二维码 UI 图标 -->
                <view
                  class="flex flex-col items-center self-stretch justify-center py-2.5 pl-1 pr-3 space-y-1.5"
                >
                  <view
                    v-if="item.status === 'pending'"
                    class="flex items-center justify-center text-tx-brown transition-transform active:scale-90"
                  >
                    <text class="i-carbon:qr-code text-2xl" />
                  </view>
                  <wd-tag
                    :type="RECORD_STATUS_MAP[item.status]?.type || 'default'"
                    round
                    size="medium"
                    custom-class="!font-bold !text-xs !px-2.5 !py-0.5"
                  >
                    {{ RECORD_STATUS_MAP[item.status]?.text || '已取消' }}
                  </wd-tag>
                </view>
              </view>
            </view>
            <view v-else class="py-20">
              <wd-empty icon="no-result" tip="暂无兑换记录" />
            </view>
            <wd-loadmore v-if="isFetchingExchanges" state="loading" @reload="fetchNextExchanges" />
          </view>
        </scroll-view>
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
