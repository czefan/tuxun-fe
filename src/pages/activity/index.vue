<script setup lang="ts">
import { computed, ref } from 'vue'
import { onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { formatDate } from '@/utils/date'
import { AppRoute, withQuery } from '@/router/routes'
import { useInfiniteActivityList } from '@/features/activity/query'
import type { ActivityQueryParams, ActivityVM } from '@/features/activity/types'
import { usePopupTopPadding, useStickyTop } from '@/composables/use-sticky-top'

definePage({
  style: {
    navigationBarTitleText: '%page.activityList%',
    enablePullDownRefresh: true,
  },
})

const stickyTopStyle = useStickyTop()
const popupTop = usePopupTopPadding()
const searchKeyword = ref('')

const emptyTip = computed(() => (searchKeyword.value.trim() ? '没有找到相关活动' : '暂无相关活动'))

const filterOptions = [
  { label: '全部', value: undefined },
  { label: '进行中', value: 'active' },
  { label: '已结束', value: 'ended' },
] as const

type FilterValue = typeof filterOptions[number]['value']
const activeFilter = ref<FilterValue>(undefined)

const {
  data,
  isLoading,
  isError,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  refetch,
} = useInfiniteActivityList(computed(() => ({
  status: activeFilter.value as ActivityQueryParams['status'],
  keyword: searchKeyword.value.trim() || undefined,
  page_size: 20,
})))

const activities = computed<ActivityVM[]>(() => data.value?.pages.flatMap(page => page.list) ?? [])

onReachBottom(() => {
  if (hasNextPage?.value && !isFetchingNextPage.value) {
    fetchNextPage()
  }
})

onPullDownRefresh(async () => {
  await refetch()
  uni.stopPullDownRefresh()
})

function goActivity(item: ActivityVM) {
  uni.navigateTo({
    url: withQuery(AppRoute.Activity, {
      id: item.id,
      title: item.title,
    }),
  })
}

const filterVisible = ref(false)

function selectFilter(val: FilterValue) {
  activeFilter.value = val
  filterVisible.value = false
}

/** 活动详情 Modal 交互控制 */
const modalVisible = ref(false)
const selectedActivity = ref<ActivityVM | null>(null)

function openDetailModal(item: ActivityVM) {
  selectedActivity.value = item
  modalVisible.value = true
}

function handleModalGoActivity() {
  if (selectedActivity.value) {
    const act = selectedActivity.value
    modalVisible.value = false
    goActivity(act)
  }
}
</script>

<template>
  <view class="page-activity safe-bottom-page--fixed-bar bg-[#F1DFC5]">
    <!-- 顶部固定吸顶搜索栏（自动适配 H5 导航栏 top: var(--window-top, 0px)，带浅色下分割线） -->
    <view class="sticky z-20 box-border w-full bg-[#F1DFC5] px-1.5 py-1.5" :style="[{ borderBottom: '1px solid rgba(211, 186, 159, 0.5)' }, stickyTopStyle]">
      <view class="flex items-center gap-2">
        <view class="min-w-0 flex-1">
          <wd-search
            v-model="searchKeyword"
            placeholder="搜索标题或描述..."
            hide-cancel
            custom-class="tx-search"
            placeholder-left
            @clear="searchKeyword = ''"
          />
        </view>
        <view
          class="shadow-2xs h-9 w-9 flex flex-shrink-0 cursor-pointer items-center justify-center border border-[#D3BA9F] rounded-full transition-transform active:scale-95"
          :class="filterVisible ? 'border-[#B69171] bg-[#B69171] text-white shadow-xs' : 'border-[#D3BA9F] bg-white text-[#1E1E1E]'"
          @tap="filterVisible = !filterVisible"
        >
          <text class="i-carbon:filter text-base" :class="filterVisible ? 'text-white' : 'text-[#B69171]'" />
        </view>
      </view>
    </view>

    <view class="px-1.5 pt-1.5 space-y-1.5">
      <!-- 筛选下拉弹出 Sheet -->
      <wd-popup
        v-model="filterVisible"
        position="top"
        :z-index="99"
        custom-style="background: transparent;"
        @close="filterVisible = false"
      >
        <view
          class="relative box-border w-full border-b border-[#D3BA9F] rounded-b-[24px] bg-[#F1DFC5] px-4 pb-5 shadow-2xl space-y-4"
          :style="{ paddingTop: popupTop.paddingTop }"
        >
          <!-- 右上角绝对定位关闭按钮 -->
          <view
            class="absolute right-4 z-1 h-8 w-8 flex cursor-pointer items-center justify-center rounded-full bg-[#B69171]/30 transition-transform active:scale-95"
            :style="{ top: popupTop.closeTop }"
            @tap="filterVisible = false"
          >
            <wd-icon name="close" size="18px" color="#1E1E1E" />
          </view>

          <!-- 活动状态筛选 -->
          <view class="space-y-1.5">
            <text class="text-xs text-[#756C5E] font-bold">活动状态</text>
            <view class="grid grid-cols-3 gap-2 py-0.5">
              <view
                v-for="opt in filterOptions"
                :key="opt.label"
                class="flex cursor-pointer items-center justify-center border rounded-xl py-2 text-xs font-bold transition-all active:scale-95"
                :class="activeFilter === opt.value ? 'border-[#B69171] bg-[#B69171] text-white shadow-xs' : 'border-[#D3BA9F] bg-white text-[#1E1E1E]'"
                @tap="selectFilter(opt.value)"
              >
                {{ opt.label }}
              </view>
            </view>
          </view>
        </view>
      </wd-popup>

      <!-- 活动卡片列表 -->
      <view v-if="activities.length" class="space-y-3">
        <view
          v-for="item in activities"
          :key="item.id"
          class="group shadow-2xs relative cursor-pointer overflow-hidden border border-[#D3BA9F] rounded-xl bg-white transition-all active:scale-[0.99]"
          @tap="openDetailModal(item)"
        >
          <!-- 图片卡片主视图 -->
          <view class="relative h-44 w-full overflow-hidden bg-[#B69171]/10">
            <wd-img
              custom-class="h-full w-full object-cover"
              lazy-load
              :src="item.coverImage.url"
              mode="aspectFill"
              width="100%"
              height="100%"
            />
            <!-- 渐变阴影保护文案透明度 -->
            <view class="pointer-events-none absolute inset-0 from-black/85 via-black/35 to-transparent bg-gradient-to-t" />

            <!-- 左上角状态徽章 -->
            <view class="absolute left-3 top-3 z-1">
              <view
                v-if="item.status === 'ongoing'"
                class="flex items-center gap-1 rounded-full bg-[#4ADE80] px-2.5 py-0.5 text-xs text-[#064E3B] font-bold shadow-sm"
              >
                <view class="h-1.5 w-1.5 animate-pulse rounded-full bg-[#047857]" />
                <text>进行中</text>
              </view>
              <view
                v-else-if="item.status === 'ended'"
                class="backdrop-blur-xs rounded-full bg-black/50 px-2.5 py-0.5 text-xs text-white/80 font-bold shadow-sm"
              >
                <text>已结束</text>
              </view>
            </view>

            <!-- 图片上方浮层：标题（最多一行） + 进入所有题目按钮 -->
            <view class="absolute bottom-3.5 left-3.5 right-3.5 z-1 flex items-center justify-between gap-2.5">
              <text class="min-w-0 flex-1 truncate text-base text-white font-black tracking-tight drop-shadow-sm">
                {{ item.title }}
              </text>
              <view
                class="shadow-xs flex flex-shrink-0 cursor-pointer items-center gap-1 rounded-full bg-[#F9DF95] px-3 py-1.5 text-xs text-[#1E1E1E] font-black transition-transform active:scale-95"
                @tap.stop="goActivity(item)"
              >
                <text>进入</text>
                <wd-icon name="arrow-right" size="12px" color="#1E1E1E" />
              </view>
            </view>
          </view>
        </view>

        <wd-loadmore
          v-if="isFetchingNextPage"
          :state="isFetchingNextPage ? 'loading' : undefined"
          @reload="fetchNextPage"
        />
      </view>

      <view v-else-if="isLoading" class="space-y-3">
        <wd-skeleton animation="gradient" :row-col="[{ width: '100%', height: '96px' }, { width: '100%', height: '96px' }]" />
      </view>

      <view v-else-if="isError" class="min-h-[50vh] flex flex-col items-center justify-center gap-3 py-12">
        <wd-empty icon="network-error" tip="加载失败，请检查网络后重试" />
        <wd-button size="small" plain round @click="refetch">
          重新加载
        </wd-button>
      </view>

      <view v-else class="min-h-[50vh] flex flex-col items-center justify-center py-12">
        <wd-empty icon="no-result" :tip="emptyTip" />
      </view>

      <!-- 点击卡片展示的完整活动详情 Modal -->
      <wd-popup
        v-model="modalVisible"
        position="center"
        :z-index="999"
        custom-style="background: transparent; width: 90%; max-width: 400px;"
      >
        <view v-if="selectedActivity" class="box-border max-h-[82vh] w-full flex flex-col overflow-hidden border border-[#D3BA9F] rounded-2xl bg-[#F1DFC5] shadow-2xl">
          <!-- 弹窗活动大图/封面 -->
          <view class="relative w-full overflow-hidden bg-[#B69171]/10">
            <wd-img
              custom-class="w-full block"
              :src="selectedActivity.coverImage.url"
              lazy-load
              mode="widthFix"
              width="100%"
              :style="{
                aspectRatio: `${selectedActivity.coverImage.width} / ${selectedActivity.coverImage.height}`,
              }"
            />
            <view class="absolute right-3 top-3 z-1 h-7 w-7 flex cursor-pointer items-center justify-center rounded-full bg-black/60 backdrop-blur-md transition-transform active:scale-90" @click="modalVisible = false">
              <wd-icon name="close" size="16px" color="#FFFFFF" />
            </view>
          </view>

          <!-- 弹窗可滚动内容区 -->
          <view class="min-h-0 flex-1 overflow-y-auto p-5 space-y-3.5">
            <text class="block text-lg text-[#1E1E1E] font-black leading-snug tracking-tight">
              {{ selectedActivity.title }}
            </text>

            <!-- 完整描述内容 -->
            <view class="border-t border-[#D3BA9F]/40 pt-2.5">
              <text class="block whitespace-pre-wrap text-sm text-[#555555] leading-relaxed">
                {{ selectedActivity.description || '暂无详细描述。' }}
              </text>
            </view>

            <!-- 时间区间 -->
            <view v-if="selectedActivity.startTime || selectedActivity.endTime" class="border-t border-[#D3BA9F]/30 pt-2.5">
              <text class="block text-sm text-[#756C5E] font-bold font-numeric">
                {{ formatDate(selectedActivity.startTime) }} ~ {{ formatDate(selectedActivity.endTime) }}
              </text>
            </view>
          </view>

          <!-- 底部固定主操作按钮 -->
          <view class="flex-shrink-0 border-t border-[#D3BA9F]/30 p-4 pt-3">
            <wd-button
              type="warning"
              round
              block
              size="large"
              custom-class="!font-black !bg-[#F9DF95] !text-[#1E1E1E] !border-0 shadow-xs active:scale-[0.99] transition-transform"
              @click="handleModalGoActivity"
            >
              进入
            </wd-button>
          </view>
        </view>
      </wd-popup>
    </view>
  </view>
</template>
