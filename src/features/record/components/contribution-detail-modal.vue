<script setup lang="ts">
import { computed } from 'vue'
import ProgressiveImage from '@/components/progressive-image/progressive-image.vue'
import StatusTag from '@/components/status-tag/status-tag.vue'
import { normalizeToGcj02 } from '@/composables/use-map'
import { useMyPhotoDetail } from '@/features/record/query'
import { AppRoute, withQuery } from '@/router/routes'
import { previewImage } from '@/utils/image-preview'

interface Props {
  id: number | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:id', val: number | null): void
}>()

const { data: detailData } = useMyPhotoDetail(computed(() => props.id))

const detailVisible = computed({
  get: () => Boolean(props.id && detailData.value),
  set: (val) => {
    if (!val) emit('update:id', null)
  },
})

function closeDetail() {
  emit('update:id', null)
}

function handleResubmit() {
  if (!detailData.value) return
  const refillData = {
    title: detailData.value.title,
    description: detailData.value.description || '',
    filePath: detailData.value.image.originUrl,
    latitude: detailData.value.location?.latitude || 0,
    longitude: detailData.value.location?.longitude || 0,
    coordType: detailData.value.location?.coord_type || 'gcj02',
  }
  const encoded = encodeURIComponent(JSON.stringify(refillData))
  closeDetail()
  uni.navigateTo({ url: withQuery(AppRoute.Contribute, { refill: encoded }) })
}

function handlePreviewDetailImage() {
  const url = detailData.value?.image?.originUrl
  if (url) {
    previewImage(url)
  }
}

function handleOpenLocation() {
  if (!detailData.value?.location?.latitude) return
  const loc = detailData.value.location
  const gcj = normalizeToGcj02(loc.latitude, loc.longitude, loc.coord_type || 'gcj02')
  uni.openLocation({
    latitude: gcj.latitude,
    longitude: gcj.longitude,
    name: detailData.value.title || '投稿机位',
    scale: 16,
  })
}
</script>

<template>
  <!-- 投稿详情与驳回原因 Modal -->
  <wd-popup
    v-model="detailVisible"
    position="center"
    :z-index="999"
    custom-style="background: transparent; width: 88vw; max-width: 640rpx;"
    @close="closeDetail"
  >
    <view
      v-if="detailData"
      class="box-border max-h-[82vh] w-full flex flex-col overflow-hidden border border-tx-border rounded-[24px] bg-tx-main shadow-2xl"
    >
      <!-- 头部固定标题 -->
      <view
        class="flex flex-shrink-0 items-center justify-between border-b border-tx-border/40 px-5 pb-2.5 pt-4"
      >
        <text class="u-title-lg">{{ detailData.title }}</text>
        <wd-icon
          name="close"
          size="20px"
          custom-class="cursor-pointer text-tx-ink-2"
          @click="closeDetail"
        />
      </view>

      <!-- 内容滚动区：图片 + 状态/描述/驳回原因 -->
      <view class="min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-2.5 space-y-3">
        <!-- 投稿图片区（点击放大预览，右下角悬浮【查看位置】胶囊按钮） -->
        <ProgressiveImage
          :image="detailData.image"
          mode="aspectFill"
          custom-class="border border-tx-border/50 rounded-xl"
          @click="handlePreviewDetailImage"
        >
          <!-- 图片右下角悬浮【查看位置】毛玻璃胶囊按钮 -->
          <view
            v-if="detailData.location?.latitude"
            class="absolute bottom-2.5 right-2.5 z-10 flex cursor-pointer items-center gap-1.5 border border-white/20 rounded-full bg-black/50 px-3 py-1 text-xs text-white font-bold shadow-md backdrop-blur-md transition-transform active:scale-95"
            @click.stop="handleOpenLocation"
          >
            <text class="i-carbon:location text-sm text-tx-accent" />
            <text>查看位置</text>
          </view>
        </ProgressiveImage>

        <view class="space-y-2.5">
          <!-- 状态（靠左）+ 投稿时间（靠右）合为一行 -->
          <view class="flex items-center justify-between">
            <StatusTag :status="detailData.status" />
            <text class="u-meta-time">{{ detailData.createdAt }}</text>
          </view>

          <!-- 题目描述展示（融入背景） -->
          <view v-if="detailData.description" class="space-y-0.5">
            <text class="block u-title-base font-bold">描述：</text>
            <text class="block u-body-sub">{{ detailData.description }}</text>
          </view>

          <view
            v-if="detailData.rejectReason"
            class="u-body-alert border border-red-200 rounded-xl bg-red-500/10 p-3"
          >
            <text class="font-bold">驳回原因：</text>
            {{ detailData.rejectReason }}
          </view>
        </view>
      </view>

      <!-- 底部固定操作栏（仅驳回状态展示） -->
      <view
        v-if="detailData.status === 'rejected'"
        class="flex-shrink-0 border-t border-tx-border/30 p-4"
      >
        <wd-button
          round
          block
          type="warning"
          size="medium"
          custom-class="!font-bold !text-sm"
          @click="handleResubmit"
        >
          修改重新提交
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>
