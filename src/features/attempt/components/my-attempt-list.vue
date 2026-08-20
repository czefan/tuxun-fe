<script setup lang="ts">
import { previewImage } from '@/utils/image-preview'
import type { MyAttemptVM } from '../types'
import type { Location } from '@/service/contract/types'

defineProps<{
  list: MyAttemptVM[]
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
}>()

const emit = defineEmits<{
  (e: 'loadMore'): void
}>()

/** 点开看高清原图 */
function handlePreview(item: MyAttemptVM) {
  if (item.image?.originUrl || item.image?.url) {
    previewImage(item.image.originUrl || item.image.url)
  }
}

/** 打开地图查看作答定位 */
function handleOpenLocation(location?: Location | null) {
  if (!location || !location.latitude || !location.longitude) {
    uni.showToast({ title: '暂无定位数据', icon: 'none' })
    return
  }
  const lat = Number(location.latitude)
  const lng = Number(location.longitude)
  uni.openLocation({
    latitude: lat,
    longitude: lng,
    name: '作答打卡定位',
    address: `经纬度: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
  })
}
</script>

<template>
  <view class="my-attempt-list space-y-3.5" :class="list.length ? '' : 'h-full'">
    <view v-if="list.length" class="px-4 pt-2.5 space-y-3.5">
      <!-- 单条作答卡片 -->
      <view
        v-for="item in list"
        :key="item.id"
        class="flex flex-col gap-2 border-b border-tx-border/30 pb-3.5 pt-1 last:border-b-0"
      >
        <!-- 顶行：左侧作答图片 + 右侧常规信息 (时间在左、状态在右，定位在下，恢复原版垂直居中位置) -->
        <view class="flex items-center gap-3">
          <!-- 左侧：作答实拍缩略图（点击放大预览） -->
          <view
            class="h-20 w-20 flex-shrink-0 cursor-pointer overflow-hidden rounded-xl bg-tx-surface ring-1 ring-tx-border/60 transition-transform active:scale-95"
            @click="handlePreview(item)"
          >
            <wd-img
              custom-class="h-full w-full object-cover"
              :src="item.image.url"
              lazy-load
              mode="aspectFill"
              width="160rpx"
              height="160rpx"
            />
          </view>

          <!-- 右侧：与 80px 图片等高，上面查看位置与状态 Tag 靠顶，下面时间靠底（带微距 py-1 缩进） -->
          <view class="h-20 flex flex-1 flex-col justify-between py-1">
            <!-- 第一行：查看位置 (u-action-link) 在左，状态 Tag 在右 -->
            <view class="flex items-center justify-between gap-2">
              <view v-if="item.location?.latitude" class="flex items-center">
                <view
                  class="flex u-action-link items-center gap-1 transition-opacity active:opacity-70"
                  @click="handleOpenLocation(item.location)"
                >
                  <text class="i-carbon:location text-sm text-tx-brown" />
                  <text>查看位置</text>
                </view>
              </view>
              <view v-else class="flex-1" />
              <status-tag :status="item.status" />
            </view>

            <!-- 第二行：时间在左 (u-meta-time) -->
            <view class="flex items-center">
              <text class="u-meta-time">{{ item.createdAt }}</text>
            </view>
          </view>
        </view>

        <!-- 底行：驳回原因全宽独占图片与主栏下方，字体调整为 text-sm (与查看定位字体一致) -->
        <view
          v-if="item.rejectReason"
          class="box-border w-full border border-rose-200/80 rounded-xl bg-rose-50/80 px-3 py-2 text-sm text-rose-700 leading-relaxed"
        >
          <text class="text-rose-800 font-bold">驳回原因：</text>{{ item.rejectReason }}
        </view>
      </view>

      <!-- 页内加载更多 -->
      <wd-button
        v-if="hasNextPage && !isFetchingNextPage"
        plain
        round
        block
        size="small"
        custom-class="!font-bold !my-2"
        @click="emit('loadMore')"
      >
        加载更多
      </wd-button>
      <wd-loadmore
        v-else-if="isFetchingNextPage"
        state="loading"
      />
    </view>

    <view v-else class="h-full flex flex-col items-center justify-center">
      <wd-empty icon="no-result" tip="暂无作答记录" />
    </view>
  </view>
</template>
