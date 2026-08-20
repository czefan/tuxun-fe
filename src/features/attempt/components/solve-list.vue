<script setup lang="ts">
import type { SolveRecordVM } from '../types'
import { useSetSolveLike } from '../query'
import { useAuth } from '@/composables/use-auth'
import { previewImage } from '@/utils/image-preview'

const props = defineProps<{
  list: SolveRecordVM[]
  /** 必填：点赞后要按这个 id 失效破解列表，缺了就静默不刷新 */
  photoId: number
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
}>()

const emit = defineEmits<{
  (e: 'loadMore'): void
}>()

const { requireLogin, isMe } = useAuth()
const { mutate: setSolveLike } = useSetSolveLike(() => props.photoId)

function handleLike(item: SolveRecordVM) {
  if (!requireLogin()) {
    return
  }
  setSolveLike({ solveId: item.id, liked: !item.liked })
}

function handlePreviewImage(url: string) {
  if (url) {
    previewImage(url)
  }
}
</script>

<template>
  <view class="solve-list space-y-3.5" :class="list.length ? '' : 'h-full'">
    <view v-if="list.length" class="px-4 pt-2.5 space-y-3.5">
      <!-- 横向单行紧凑布局：左侧图片 + 右侧作者/时间/点赞 -->
      <view
        v-for="item in list"
        :key="item.id"
        class="flex items-center gap-3 border-b border-tx-border/30 pb-3.5 last:border-b-0"
      >
        <!-- 左侧：破解实拍缩略图（点击放大预览） -->
        <view
          class="h-20 w-20 flex-shrink-0 cursor-pointer overflow-hidden rounded-xl bg-tx-surface ring-1 ring-tx-border/60 transition-transform active:scale-95"
          @click="handlePreviewImage(item.image.originUrl || item.image.url)"
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

        <!-- 右侧：与 80px 图片等高，上面作者点赞靠顶，下面时间靠底（带微距 py-1 缩进） -->
        <view class="h-20 flex flex-1 flex-col justify-between py-1">
          <view class="flex items-center justify-between gap-2">
            <!-- 作者头像与昵称（不加黑） -->
            <view class="flex items-center gap-2">
              <wd-img
                custom-class="h-7 w-7 rounded-full bg-tx-surface object-cover ring-1 ring-tx-brown/30 shadow-2xs"
                :src="item.author.avatar || '/static/images/default-avatar.png'"
                lazy-load
                mode="aspectFill"
                round
                width="56rpx"
                height="56rpx"
              />
              <view class="min-w-0 flex items-center">
                <text class="truncate u-user-name">{{ item.author.nickname }}</text>
                <text v-if="isMe(item.author.id)" class="ml-1 flex-shrink-0 rounded bg-tx-brown/15 px-1 py-0.2 text-[10px] text-tx-brown font-bold leading-none">我</text>
              </view>
            </view>

            <!-- 右侧点赞按钮 -->
            <like-button :liked="item.liked" :count="item.likesCount" icon-size="15px" font-size="12px" @click="handleLike(item)" />
          </view>

          <!-- 时间：靠左展示 (u-meta-time) -->
          <view v-if="item.createdAt">
            <text class="u-meta-time">{{ item.createdAt }}</text>
          </view>
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
      <wd-empty icon="no-result" tip="暂无破解记录" />
    </view>
  </view>
</template>
