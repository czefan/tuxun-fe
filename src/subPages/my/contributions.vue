<script setup lang="ts">
import { computed, ref } from 'vue'
import { onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { normalizeToGcj02 } from '@/composables/use-map'
import { useInfiniteMyPhotos, useMyPhotoDetail } from '@/features/record/query'
import type { UserPhotoVM } from '@/features/record/types'
import { useAuth } from '@/features/user/composables/use-auth'
import { AppRoute, withQuery } from '@/router/routes'
import { previewImage } from '@/utils/image-preview'

definePage({
  style: {
    navigationBarTitleText: '%page.contributions%',
    enablePullDownRefresh: true,
  },
})

const { isLoggedIn, loginDirectly } = useAuth()

const activeStatusIndex = ref('全部')
const statusOptions = ['全部', '审核中', '已通过', '未通过']
const statusMap: Record<string, undefined | 'pending' | 'approved' | 'rejected'> = {
  全部: undefined,
  审核中: 'pending',
  已通过: 'approved',
  未通过: 'rejected',
}

const queryParams = computed(() => ({
  status: statusMap[activeStatusIndex.value],
  page_size: 20,
}))

const selectedId = ref<number | null>(null)
const {
  data: photosPagesData,
  isLoading,
  isError,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  refetch,
} = useInfiniteMyPhotos(queryParams)

const { data: detailData } = useMyPhotoDetail(selectedId)

const photoList = computed<UserPhotoVM[]>(() => photosPagesData.value?.pages.flatMap(page => page.list) ?? [])

function getFilteredList(opt: string) {
  if (opt === '全部')
    return photoList.value
  if (opt === '审核中') {
    return photoList.value.filter(item => String(item.status).toLowerCase() === 'pending')
  }
  if (opt === '已通过') {
    return photoList.value.filter(item => String(item.status).toLowerCase() === 'approved' || String(item.status).toLowerCase() === 'published')
  }
  if (opt === '未通过') {
    return photoList.value.filter(item => String(item.status).toLowerCase() === 'rejected')
  }
  return photoList.value
}

const detailVisible = computed({
  get: () => Boolean(selectedId.value && detailData.value),
  set: (val) => {
    if (!val)
      selectedId.value = null
  },
})

onReachBottom(() => {
  if (hasNextPage?.value && !isFetchingNextPage.value) {
    fetchNextPage()
  }
})

onPullDownRefresh(async () => {
  await refetch()
  uni.stopPullDownRefresh()
})

function openDetail(item: UserPhotoVM) {
  const statusStr = String(item.status || '').toLowerCase()
  if (statusStr === 'approved' || statusStr === 'published') {
    uni.navigateTo({ url: withQuery(AppRoute.QuestionDetail, { id: item.id }) })
    return
  }
  selectedId.value = item.id
}

function closeDetail() {
  selectedId.value = null
}

function handleResubmit() {
  if (!detailData.value)
    return
  const refillData = {
    title: detailData.value.title,
    description: detailData.value.description || '',
    filePath: detailData.value.image.originUrl || detailData.value.image.url,
    latitude: detailData.value.location?.latitude || 0,
    longitude: detailData.value.location?.longitude || 0,
    coordType: detailData.value.location?.coord_type || 'gcj02',
  }
  const encoded = encodeURIComponent(JSON.stringify(refillData))
  closeDetail()
  uni.navigateTo({ url: withQuery(AppRoute.Contribute, { refill: encoded }) })
}

function handlePreviewDetailImage() {
  const url = detailData.value?.image?.originUrl || detailData.value?.image?.url
  if (url) {
    previewImage(url)
  }
}

function handleOpenLocation() {
  if (!detailData.value?.location?.latitude)
    return
  const loc = detailData.value.location
  const gcj = normalizeToGcj02(loc.latitude, loc.longitude, loc.coord_type || 'gcj02')
  uni.openLocation({
    latitude: gcj.latitude,
    longitude: gcj.longitude,
    name: detailData.value.title || '投稿机位',
    scale: 16,
  })
}
const currentTabIndex = computed(() => statusOptions.indexOf(activeStatusIndex.value))
</script>

<template>
  <view class="page-my-contributions swiper-page bg-[#F1DFC5] px-3 pt-3">
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

    <swiper
      class="box-border min-h-0 w-[calc(100%+24px)] flex-1 -mx-3"
      :current="currentTabIndex"
      :duration="300"
      @change="(e) => activeStatusIndex = statusOptions[e.detail.current]"
    >
      <swiper-item v-for="opt in statusOptions" :key="opt" class="box-border">
        <scroll-view scroll-y :show-scrollbar="false" class="hide-scrollbar box-border h-full w-full" @scrolltolower="() => fetchNextPage()">
          <view v-if="!isLoggedIn()" class="min-h-full flex flex-col items-center justify-center -mt-6">
            <wd-empty icon="no-result" tip="登录后查看投稿记录" />
            <wd-button size="small" round type="warning" custom-class="!mt-4 !font-bold shadow-md" @click="loginDirectly">
              去登录
            </wd-button>
          </view>
          <view v-else class="bottom-space px-3 pt-2.5 space-y-3">
            <view v-if="isLoading" class="space-y-3">
              <wd-skeleton animation="gradient" :row-col="[{ width: '100%', height: '70px' }, { width: '100%', height: '70px' }]" />
            </view>
            <view v-else-if="isError" class="flex flex-col items-center justify-center gap-3 py-20">
              <wd-empty icon="network-error" tip="加载失败，请检查网络后重试" />
              <wd-button size="small" plain round @click="refetch">
                重新加载
              </wd-button>
            </view>
            <view v-else-if="getFilteredList(opt).length > 0" class="border-y border-[#B69171]">
              <view
                v-for="(item, index) in getFilteredList(opt)"
                :key="item.id"
                class="flex cursor-pointer items-center justify-between py-3.5 transition-colors active:opacity-75"
                :class="index > 0 ? 'border-t border-[#B69171]' : ''"
                @tap="openDetail(item)"
              >
                <view class="mr-2 h-16 min-w-0 flex flex-1 items-center gap-3">
                  <wd-img
                    custom-class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-[#B69171]/10 object-cover ring-1 ring-[#D3BA9F]"
                    lazy-load
                    :src="item.image.url"
                    mode="aspectFill"
                    width="64px"
                    height="64px"
                  />
                  <view class="h-16 min-w-0 flex flex-1 flex-col justify-between py-1">
                    <text class="line-clamp-2 block u-title-base font-bold">{{ item.title }}</text>
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
              <wd-empty icon="no-result" tip="暂无投稿记录" />
            </view>
          </view>
        </scroll-view>
      </swiper-item>
    </swiper>

    <!-- 投稿详情与驳回原因 Modal -->
    <wd-popup
      v-model="detailVisible"
      position="center"
      :z-index="999"
      custom-style="background: transparent; width: 88vw; max-width: 640rpx;"
      @close="closeDetail"
    >
      <view v-if="detailData" class="box-border max-h-[82vh] w-full flex flex-col overflow-hidden border border-[#D3BA9F] rounded-[24px] bg-[#F1DFC5] shadow-2xl">
        <!-- 头部固定标题 -->
        <view class="flex flex-shrink-0 items-center justify-between border-b border-[#D3BA9F]/40 px-5 pb-2.5 pt-4">
          <text class="u-title-lg">{{ detailData.title }}</text>
          <wd-icon name="close" size="20px" custom-class="cursor-pointer text-[#756C5E]" @click="closeDetail" />
        </view>

        <!-- 内容滚动区：图片 + 状态/描述/驳回原因 -->
        <view class="min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-2.5 space-y-3">
          <!-- 投稿图片区（点击放大预览，右下角悬浮【查看位置】胶囊按钮） -->
          <view class="relative w-full flex overflow-hidden border border-[#D3BA9F]/50 rounded-xl bg-[#B69171]/10">
            <wd-img
              custom-class="shadow-2xs !block w-full cursor-pointer transition-opacity active:opacity-90"
              custom-style="display: block; vertical-align: top;"
              lazy-load
              :src="detailData.image.originUrl || detailData.image.url"
              mode="widthFix"
              width="100%"
              @click="handlePreviewDetailImage"
            />

            <!-- 图片右下角悬浮【查看位置】毛玻璃胶囊按钮 -->
            <view
              v-if="detailData.location?.latitude"
              class="absolute bottom-2.5 right-2.5 z-10 flex cursor-pointer items-center gap-1.5 border border-white/20 rounded-full bg-black/50 px-3 py-1 text-xs text-white font-bold shadow-md backdrop-blur-md transition-transform active:scale-95"
              @click.stop="handleOpenLocation"
            >
              <text class="i-carbon:location text-sm text-[#F9DF95]" />
              <text>查看位置</text>
            </view>
          </view>

          <view class="space-y-2.5">
            <!-- 状态（靠左）+ 投稿时间（靠右）合为一行 -->
            <view class="flex items-center justify-between">
              <status-tag :status="detailData.status" />
              <text class="u-meta-time">{{ detailData.createdAt }}</text>
            </view>

            <!-- 题目描述展示（融入背景） -->
            <view v-if="detailData.description" class="space-y-0.5">
              <text class="block u-title-base font-bold">描述：</text>
              <text class="block u-body-sub">{{ detailData.description }}</text>
            </view>

            <view v-if="detailData.rejectReason" class="u-body-alert border border-red-200 rounded-xl bg-red-500/10 p-3">
              <text class="font-bold">驳回原因：</text>
              {{ detailData.rejectReason }}
            </view>
          </view>
        </view>

        <!-- 底部固定操作栏（仅驳回状态展示） -->
        <view v-if="detailData.status === 'rejected'" class="flex-shrink-0 border-t border-[#D3BA9F]/30 p-4">
          <wd-button round block type="warning" size="medium" custom-class="!font-bold !text-sm" @click="handleResubmit">
            修改重新提交
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>
