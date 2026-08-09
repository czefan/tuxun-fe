<script setup lang="ts">
import { computed, ref } from 'vue'
import { onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { useInfiniteMyAttemptRecords } from '@/features/record/query'
import type { UserAttemptRecordVM } from '@/features/record/types'
import { useAuth } from '@/features/user/composables/use-auth'
import { AppRoute, withQuery } from '@/router/routes'

definePage({
  style: {
    navigationBarTitleText: '%page.answers%',
    enablePullDownRefresh: true,
  },
})

const { isLoggedIn, loginDirectly } = useAuth()
const activeStatusIndex = ref('全部')
const statusOptions = ['全部', '审核中', '已破解', '未破解']
const statusMap: Record<string, undefined | 'pending' | 'solved' | 'unsolved'> = {
  全部: undefined,
  审核中: 'pending',
  已破解: 'solved',
  未破解: 'unsolved',
}

const queryParams = computed(() => ({
  status: statusMap[activeStatusIndex.value],
  page_size: 20,
}))

const {
  data: attemptsPagesData,
  isPending: isLoading,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  refetch,
} = useInfiniteMyAttemptRecords(queryParams)

const list = computed<UserAttemptRecordVM[]>(() => attemptsPagesData.value?.pages.flatMap(page => page.list) ?? [])

function getFilteredList(opt: string) {
  if (opt === '全部')
    return list.value
  if (opt === '审核中') {
    return list.value.filter(item => String(item.status).toLowerCase() === 'pending')
  }
  if (opt === '已破解') {
    return list.value.filter(item => String(item.status).toLowerCase() === 'solved')
  }
  if (opt === '未破解') {
    // 契约只下发 status；未破解页签严格只显示 unsolved，不混入已破解
    return list.value.filter(item => String(item.status).toLowerCase() === 'unsolved')
  }
  return list.value
}

onReachBottom(() => {
  if (hasNextPage?.value && !isFetchingNextPage.value) {
    fetchNextPage()
  }
})

onPullDownRefresh(async () => {
  // 只重拉本页自己的列表。无参 invalidateQueries() 会失效全站查询——
  // 下拉刷新首页不该把商城、通知、用户资料一起作废重拉。
  await refetch()
  uni.stopPullDownRefresh()
})

function goPhotoDetail(photoId: number) {
  if (photoId) {
    uni.navigateTo({ url: withQuery(AppRoute.QuestionDetail, { id: photoId }) })
  }
}
const currentTabIndex = computed(() => statusOptions.indexOf(activeStatusIndex.value))
</script>

<template>
  <view class="page-my-answers swiper-page bg-[#F1DFC5] px-3 pt-3">
    <!-- 融入页面的顶栏 Seamless Sub Tab 切换器 -->
    <view class="flex flex-shrink-0 items-center gap-6 px-1 pb-0" style="border-bottom: 1px solid rgba(211, 186, 159, 0.5);">
      <view
        v-for="opt in statusOptions"
        :key="opt"
        class="relative cursor-pointer pb-2.5 text-base transition-all active:scale-95"
        :class="activeStatusIndex === opt ? 'text-[#1E1E1E] font-black' : 'text-[#8A7E70] font-bold'"
        @tap="activeStatusIndex = opt"
      >
        <text>{{ opt }}</text>
        <view
          v-if="activeStatusIndex === opt"
          class="absolute left-0 right-0 h-[2.5px] rounded-full bg-[#B69171] -bottom-[1px]"
        />
      </view>
    </view>

    <!-- 支持左右平滑连贯拖拽滑屏的 Swiper 容器 -->
    <swiper
      class="box-border min-h-0 w-[calc(100%+24px)] flex-1 -mx-3"
      :current="currentTabIndex"
      :duration="300"
      @change="(e) => activeStatusIndex = statusOptions[e.detail.current]"
    >
      <swiper-item v-for="opt in statusOptions" :key="opt" class="box-border">
        <scroll-view scroll-y :show-scrollbar="false" class="hide-scrollbar box-border h-full w-full" @scrolltolower="() => fetchNextPage()">
          <view v-if="!isLoggedIn()" class="min-h-full flex flex-col items-center justify-center -mt-6">
            <wd-empty icon="no-result" tip="登录后查看作答记录" />
            <wd-button size="small" round type="warning" custom-class="!mt-4 !font-bold shadow-md" @click="loginDirectly">
              去登录
            </wd-button>
          </view>
          <view v-else class="bottom-space px-3 pt-2.5 space-y-3">
            <view v-if="isLoading" class="space-y-3">
              <wd-skeleton animation="gradient" :row-col="[{ width: '100%', height: '70px' }, { width: '100%', height: '70px' }]" />
            </view>
            <view v-else-if="getFilteredList(opt).length > 0" class="border-y border-[#B69171]">
              <view
                v-for="(item, index) in getFilteredList(opt)"
                :key="item.id"
                class="flex cursor-pointer items-center justify-between py-3.5 transition-colors active:opacity-75"
                :class="index > 0 ? 'border-t border-[#B69171]' : ''"
                @tap="goPhotoDetail(item.photo.id)"
              >
                <view class="mr-2 h-16 min-w-0 flex flex-1 items-center gap-3">
                  <wd-img
                    custom-class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-[#B69171]/10 object-cover ring-1 ring-[#D3BA9F]"
                    lazy-load
                    :src="item.photo.image.url"
                    mode="aspectFill"
                    width="64px"
                    height="64px"
                  />
                  <view class="h-16 min-w-0 flex flex-1 flex-col justify-between py-1">
                    <text class="line-clamp-2 block u-title-base font-bold">
                      {{ item.photo.title }}
                      <text class="ml-1 u-action-link text-base"> {{ Math.min(item.userAttemptsCount || 1, 5) }}/5</text>
                    </text>
                    <text class="block u-meta-time">{{ item.createdAt }}</text>
                  </view>
                </view>
                <status-tag :status="item.status" />
              </view>

              <wd-loadmore
                v-if="isFetchingNextPage"
                :state="isFetchingNextPage ? 'loading' : undefined"
                @reload="fetchNextPage"
              />
            </view>

            <view v-else class="py-20">
              <wd-empty icon="no-result" tip="暂无作答记录" />
            </view>
          </view>
        </scroll-view>
      </swiper-item>
    </swiper>
  </view>
</template>
