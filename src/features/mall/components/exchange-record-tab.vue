<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useInfiniteExchangeList } from '../query'
import type { ExchangeRecordVM } from '../types'
import ListStateView from '@/components/list-state-view/list-state-view.vue'
import { useAuth } from '@/composables/use-auth'
import { useInfiniteListPage } from '@/composables/use-infinite-list-page'

interface Props {
  active?: boolean
}

defineOptions({
  options: {
    virtualHost: true,
  },
})

const props = withDefaults(defineProps<Props>(), {
  active: true,
})

const emit = defineEmits<{
  (e: 'select-record', record: ExchangeRecordVM): void
  (e: 'login'): void
}>()

const { isLoggedIn, requireLogin } = useAuth()

const hasActivated = ref(props.active)
watch(
  () => props.active,
  (val) => {
    if (val) hasActivated.value = true
  },
)

const {
  data: exchangeData,
  isLoading: exchangeLoading,
  isError: exchangeError,
  fetchNextPage: fetchNextExchanges,
  hasNextPage: hasNextExchanges,
  isFetchingNextPage: isFetchingExchanges,
  refetch: refetchExchanges,
} = useInfiniteExchangeList(undefined, {
  enabled: computed(() => isLoggedIn() && hasActivated.value),
})

const exchangeList = computed<ExchangeRecordVM[]>(
  () => exchangeData.value?.pages.flatMap((p) => p.list) ?? [],
)

useInfiniteListPage({
  hasNextPage: hasNextExchanges,
  isFetchingNextPage: isFetchingExchanges,
  fetchNextPage: fetchNextExchanges,
  refetch: refetchExchanges,
  enabled: () => isLoggedIn() && props.active,
})

const RECORD_STATUS_MAP: Record<string, { text: string; type: 'warning' | 'success' | 'default' }> =
  {
    pending: { text: '待核销', type: 'warning' },
    verified: { text: '已核销', type: 'success' },
    cancelled: { text: '已取消', type: 'default' },
  }

function handleLogin() {
  if (!requireLogin()) {
    emit('login')
  }
}

function handleRecordTap(item: ExchangeRecordVM) {
  if (item.status === 'pending') {
    emit('select-record', item)
  }
}

defineExpose({
  refetch: refetchExchanges,
  exchangeList,
})
</script>

<template>
  <scroll-view
    scroll-y
    :show-scrollbar="false"
    class="hide-scrollbar box-border h-full w-full"
    @scrolltolower="() => fetchNextExchanges()"
  >
    <ListStateView
      :needs-login="!isLoggedIn()"
      :loading="exchangeLoading || !hasActivated"
      :error="exchangeError"
      :empty="!exchangeList.length"
      login-tip="登录后查看兑换记录"
      empty-tip="暂无兑换记录"
      loading-variant="spinner"
      @login="handleLogin"
      @retry="refetchExchanges"
    >
      <!-- 兑换记录卡片列表 -->
      <view class="bottom-space--bar px-3 pt-2.5 space-y-3">
        <view class="space-y-3">
          <view
            v-for="item in exchangeList"
            :key="item.id"
            class="shadow-2xs min-h-[84px] flex items-stretch justify-between overflow-hidden border border-tx-border/60 rounded-xl bg-white transition-all"
            :class="item.status === 'pending' ? 'cursor-pointer active:scale-[0.99]' : 'opacity-85'"
            @tap="handleRecordTap(item)"
          >
            <!-- 左侧图片：84px 正方形通高大图 -->
            <view
              class="relative min-h-[84px] w-[84px] flex-shrink-0 self-stretch overflow-hidden bg-tx-brown/10"
            >
              <wd-img
                custom-class="h-full w-full object-cover block"
                lazy-load
                :src="item.good.image?.url"
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
                <text class="i-carbon-qr-code text-2xl" />
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
        <wd-loadmore v-if="isFetchingExchanges" state="loading" @reload="fetchNextExchanges" />
      </view>
    </ListStateView>
  </scroll-view>
</template>
