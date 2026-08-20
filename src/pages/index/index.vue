<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useAuth } from '@/features/user/composables/use-auth'
import { useInfinitePhotoList } from '@/features/photo/query'
import PhotoWaterfall from '@/features/photo/components/photo-waterfall.vue'
import { TX_BG_MAIN, TX_INK } from '@/styles/constants'
import { useViewTransition } from '@/composables/use-view-transition'
import { usePopupTopPadding, useStickyTop } from '@/composables/use-sticky-top'
import { useInfiniteListPage } from '@/composables/use-infinite-list-page'
import { AppRoute, withQuery } from '@/router/routes'
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
  background: TX_BG_MAIN,
}))
const stickyTopStyle = useStickyTop()
const popupTop = usePopupTopPadding()

const { isLoggedIn, isLoggedInRef, requireLogin } = useAuth()

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
  isLoading,
  isError,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  refetch,
} = useInfinitePhotoList(computed(() => ({
  activity_status: 'active',
  keyword: searchKeyword.value || undefined,
  sort_by: sortType.value,
  solved: solvedParam.value,
  page_size: 20,
})))

const photoList = computed<PhotoCardVM[]>(() => data.value?.pages.flatMap(page => page.list) ?? [])

useInfiniteListPage({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  refetch,
})

const { navigateWithTransition } = useViewTransition()
const openingPhotoId = ref<number | null>(null)

async function handlePhotoOpen(item: PhotoCardVM) {
  openingPhotoId.value = item.id
  await nextTick()
  await navigateWithTransition(
    withQuery(AppRoute.QuestionDetail, {
      id: item.id,
      activity_status: 'active',
      sort_by: sortType.value,
      solved: solvedParam.value,
      keyword: searchKeyword.value.trim() || undefined,
    }),
    () => {
      openingPhotoId.value = null
    },
  )
}

const filterVisible = ref(false)

function handleSortSelect(opt: string) {
  sortCurrent.value = opt
}

function handleStatusSelect(st: string) {
  if (st !== '全部' && !requireLogin()) {
    return
  }
  statusCurrent.value = st
}
</script>

<template>
  <view class="safe-bottom-page--fixed-bar box-border w-full" :style="pageStyle">
    <!-- 顶部固定吸顶搜索栏（自动适配 H5 导航栏 top: var(--window-top, 0px)，带浅色下分割线） -->
    <view class="sticky z-20 box-border w-full bg-tx-main px-1.5 py-1.5" :style="[{ borderBottom: '1px solid rgba(211, 186, 159, 0.5)' }, stickyTopStyle]">
      <view class="flex items-center gap-2">
        <view class="min-w-0 flex-1">
          <wd-search
            v-model="searchKeyword"
            placeholder="搜索标题、线索或发布人..."
            hide-cancel
            custom-class="tx-search"
            placeholder-left
            @clear="searchKeyword = ''"
          />
        </view>
        <view
          class="shadow-2xs h-9 w-9 flex flex-shrink-0 cursor-pointer items-center justify-center border border-tx-border rounded-full transition-transform active:scale-95"
          :class="filterVisible ? 'border-tx-brown bg-tx-brown text-white shadow-xs' : 'border-tx-border bg-white text-tx-ink'"
          @click="filterVisible = !filterVisible"
        >
          <text class="i-carbon:filter text-base" :class="filterVisible ? 'text-white' : 'text-tx-brown'" />
        </view>
      </view>
    </view>

    <main class="box-border w-full px-1.5 pt-1.5 space-y-1.5">
      <!-- 题目瀑布流核心组件 -->
      <photo-waterfall
        :opening-id="openingPhotoId"
        :list="photoList"
        :loading="isLoading"
        :error="isError"
        @open="handlePhotoOpen"
        @retry="refetch"
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
      <view
        class="relative box-border w-full border-b border-tx-border rounded-b-[24px] bg-tx-main px-4 pb-5 shadow-2xl space-y-4"
        :style="{ paddingTop: popupTop.paddingTop }"
      >
        <!-- 右上角绝对定位关闭按钮 -->
        <view
          class="absolute right-4 z-1 h-8 w-8 flex cursor-pointer items-center justify-center rounded-full bg-tx-brown/30 transition-transform active:scale-90"
          :style="{ top: popupTop.closeTop }"
          @click="filterVisible = false"
        >
          <wd-icon name="close" size="18px" :color="TX_INK" />
        </view>

        <!-- 排序方式 -->
        <view class="space-y-1.5">
          <text class="text-xs text-tx-ink-2 font-bold">排序方式</text>
          <view class="grid grid-cols-2 gap-2">
            <view
              v-for="opt in sortOptions"
              :key="opt"
              class="flex cursor-pointer items-center justify-center border rounded-xl py-2 text-xs font-bold transition-all active:scale-95"
              :class="sortCurrent === opt ? 'border-tx-brown bg-tx-brown text-white shadow-xs' : 'border-tx-border bg-white text-tx-ink'"
              @click="handleSortSelect(opt)"
            >
              {{ opt }}
            </view>
          </view>
        </view>

        <!-- 破解状态 (包含本人是否已破解) -->
        <view class="space-y-1.5">
          <text class="text-xs text-tx-ink-2 font-bold">破解状态（本人）</text>
          <view class="grid grid-cols-3 gap-2">
            <view
              v-for="st in statusOptions"
              :key="st"
              class="flex cursor-pointer items-center justify-center border rounded-xl py-2 text-xs font-bold transition-all active:scale-95"
              :class="statusCurrent === st ? 'border-tx-brown bg-tx-brown text-white shadow-xs' : 'border-tx-border bg-white text-tx-ink'"
              @click="handleStatusSelect(st)"
            >
              {{ st }}
            </view>
          </view>
        </view>
      </view>
    </wd-popup>
  </view>
</template>
