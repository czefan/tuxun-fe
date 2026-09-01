<script setup lang="ts">
import { computed, watch } from 'vue'
import { useInfiniteGoodsList } from '../query'
import type { GoodsVM } from '../types'
import ListStateView from '@/components/list-state-view/list-state-view.vue'
import { useInfiniteListPage } from '@/composables/use-infinite-list-page'

interface Props {
  keyword?: string
  active?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  keyword: '',
  active: true,
})

const emit = defineEmits<{
  (e: 'select-good', good: GoodsVM): void
  (e: 'update:goods', list: GoodsVM[]): void
}>()

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
    keyword: props.keyword.trim() || undefined,
  })),
)

const goodsList = computed<GoodsVM[]>(() => goodsData.value?.pages.flatMap((p) => p.list) ?? [])

watch(
  goodsList,
  (list) => {
    emit('update:goods', list)
  },
  { immediate: true },
)

useInfiniteListPage({
  hasNextPage: hasNextGoods,
  isFetchingNextPage: isFetchingGoods,
  fetchNextPage: fetchNextGoods,
  refetch: refetchGoods,
  enabled: () => props.active,
})

defineExpose({
  refetch: refetchGoods,
  goodsList,
})
</script>

<template>
  <scroll-view
    scroll-y
    :show-scrollbar="false"
    class="hide-scrollbar box-border h-full w-full"
    @scrolltolower="() => fetchNextGoods()"
  >
    <ListStateView
      :loading="goodsLoading"
      :error="goodsError"
      :empty="!goodsList.length"
      loading-variant="skeleton"
      empty-tip="暂无商品"
      @retry="refetchGoods"
    >
      <!-- 1. 加载态骨架屏 -->
      <template #loading>
        <view class="bottom-space--bar px-3 pt-2.5 space-y-4">
          <view class="grid grid-cols-2 gap-3">
            <wd-skeleton animation="gradient" :row-col="[{ width: '100%', height: '140px' }]" />
            <wd-skeleton animation="gradient" :row-col="[{ width: '100%', height: '140px' }]" />
          </view>
        </view>
      </template>

      <!-- 2. 正常商品网格 -->
      <view class="bottom-space--bar px-3 pt-2.5 space-y-4">
        <view class="grid grid-cols-2 gap-2.5">
          <view
            v-for="item in goodsList"
            :key="item.id"
            class="shadow-2xs flex flex-col cursor-pointer justify-between overflow-hidden border border-tx-border/60 rounded-lg bg-white transition-all active:scale-[0.98]"
            @tap="emit('select-good', item)"
          >
            <!-- 商品图片 (固定正方形比例，cover 裁剪) -->
            <view class="relative aspect-square w-full overflow-hidden bg-tx-brown/10">
              <wd-img
                custom-class="h-full w-full object-cover block"
                :src="item.image?.url"
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
        <wd-loadmore v-if="isFetchingGoods" state="loading" @reload="fetchNextGoods" />
      </view>
    </ListStateView>
  </scroll-view>
</template>
