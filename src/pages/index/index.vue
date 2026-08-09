<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { useAuth } from '@/features/user/composables/use-auth'
import { useInfinitePhotoList } from '@/features/photo/query'
import PhotoWaterfall from '@/features/photo/components/photo-waterfall.vue'
import { useViewTransition } from '@/composables/use-view-transition'
import type { PhotoCardVM } from '@/features/photo/types'

definePage({
  type: 'home',
  style: {
    navigationBarTitleText: '%page.home%',
    enablePullDownRefresh: true,
  },
})

const sortCurrent = ref('最热')
const sortOptions = ['最热', '最新']

const statusCurrent = ref('全部')
const statusOptions = ['全部', '未破解', '已破解']

const searchKeyword = ref('')

const sortType = computed(() => {
  if (sortCurrent.value === '最热')
    return 'hot'
  return 'created_at'
})
const pageStyle = computed(() => ({
  background: '#F1DFC5',
}))

const { isLoggedIn, isLoggedInRef } = useAuth()

// 退出登录后把筛选复位
watch(isLoggedInRef, (loggedIn) => {
  if (!loggedIn) {
    statusCurrent.value = '全部'
  }
})

const solvedParam = computed(() => {
  if (!isLoggedIn()) {
    return undefined
  }
  if (statusCurrent.value === '未破解') {
    return false
  }
  if (statusCurrent.value === '已破解') {
    return true
  }
  return undefined
})

const {
  data,
  isPending,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  refetch,
} = useInfinitePhotoList(computed(() => ({
  keyword: searchKeyword.value || undefined,
  sort_by: sortType.value,
  solved: solvedParam.value,
  page_size: 20,
})))

const photoList = computed<PhotoCardVM[]>(() => data.value?.pages.flatMap(page => page.list) ?? [])

onReachBottom(() => {
  if (hasNextPage?.value && !isFetchingNextPage.value) {
    fetchNextPage()
  }
})

onPullDownRefresh(async () => {
  await refetch()
  uni.stopPullDownRefresh()
})

const { navigateWithTransition } = useViewTransition()
const openingPhotoId = ref<number | null>(null)

async function handlePhotoOpen(item: PhotoCardVM) {
  openingPhotoId.value = item.id
  await nextTick()
  await navigateWithTransition(`/subPages/question/detail?id=${item.id}`, () => {
    openingPhotoId.value = null
  })
}

const filterVisible = ref(false)
</script>

<template>
  <view class="safe-bottom-page--fixed-bar box-border w-full" :style="pageStyle">
    <!-- 顶部固定吸顶搜索栏（自动适配 H5 导航栏 top: var(--window-top, 0px)，带浅色下分割线） -->
    <view class="sticky top-[var(--window-top,0px)] z-20 box-border w-full bg-[#F1DFC5] px-1.5 py-1.5" style="border-bottom: 1px solid rgba(211, 186, 159, 0.5);">
      <view class="flex items-center gap-2">
        <view class="min-w-0 flex-1">
          <wd-search
            v-model="searchKeyword"
            placeholder="搜索题目、线索或发布人..."
            hide-cancel
            custom-class="tx-search"
            placeholder-left
            @clear="searchKeyword = ''"
          />
        </view>
        <view
          class="shadow-2xs h-9 w-9 flex flex-shrink-0 cursor-pointer items-center justify-center border border-[#D3BA9F] rounded-full transition-transform active:scale-95"
          :class="filterVisible ? 'border-[#B69171] bg-[#B69171] text-white shadow-xs' : 'border-[#D3BA9F] bg-white text-[#1E1E1E]'"
          @click="filterVisible = !filterVisible"
        >
          <text class="i-carbon:filter text-base" :class="filterVisible ? 'text-white' : 'text-[#B69171]'" />
        </view>
      </view>
    </view>

    <main class="box-border w-full px-1.5 pt-1.5 space-y-1.5">
      <!-- 题目瀑布流核心组件 -->
      <photo-waterfall
        :opening-id="openingPhotoId"
        :list="photoList"
        :loading="isPending"
        @open="handlePhotoOpen"
      />

      <wd-loadmore
        v-if="isFetchingNextPage"
        :state="isFetchingNextPage ? 'loading' : undefined"
        @reload="fetchNextPage"
      />
    </main>

    <!-- 筛选从顶栏往下下拉弹出 Sheet (Top Dropdown Popup) -->
    <wd-popup
      v-model="filterVisible"
      position="top"
      :z-index="99"
      custom-style="background: transparent;"
      @close="filterVisible = false"
    >
      <view class="relative box-border w-full border-b border-[#D3BA9F] rounded-b-[24px] bg-[#F1DFC5] px-4 pb-5 pt-[calc(var(--status-bar-height,20px)+60px)] shadow-2xl space-y-4">
        <!-- 右上角绝对定位关闭按钮 -->
        <view class="absolute right-4 top-[calc(var(--status-bar-height,20px)+52px)] z-1 h-8 w-8 flex cursor-pointer items-center justify-center rounded-full bg-[#B69171]/30 transition-transform active:scale-90" @click="filterVisible = false">
          <wd-icon name="close" size="18px" color="#1E1E1E" />
        </view>

        <!-- 排序方式 -->
        <view class="space-y-1.5">
          <text class="text-xs text-[#756C5E] font-bold">排序方式</text>
          <view class="grid grid-cols-2 gap-2">
            <view
              v-for="opt in sortOptions"
              :key="opt"
              class="flex cursor-pointer items-center justify-center border rounded-xl py-2 text-xs font-bold transition-all active:scale-95"
              :class="sortCurrent === opt ? 'border-[#B69171] bg-[#B69171] text-white shadow-xs' : 'border-[#D3BA9F] bg-white text-[#1E1E1E]'"
              @click="sortCurrent = opt"
            >
              {{ opt }}
            </view>
          </view>
        </view>

        <!-- 破解状态 (包含本人是否已破解) -->
        <view class="space-y-1.5">
          <text class="text-xs text-[#756C5E] font-bold">破解状态</text>
          <view class="grid grid-cols-3 gap-2">
            <view
              v-for="st in statusOptions"
              :key="st"
              class="flex cursor-pointer items-center justify-center border rounded-xl py-2 text-xs font-bold transition-all active:scale-95"
              :class="statusCurrent === st ? 'border-[#B69171] bg-[#B69171] text-white shadow-xs' : 'border-[#D3BA9F] bg-white text-[#1E1E1E]'"
              @click="statusCurrent = st"
            >
              {{ st }}
            </view>
          </view>
        </view>
      </view>
    </wd-popup>
  </view>
</template>
