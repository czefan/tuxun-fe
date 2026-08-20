<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDeleteComment, useInfiniteCommentList, useSetCommentLike } from '../query'
import type { CommentVM } from '../types'
import { useAuth } from '@/composables/use-auth'

const props = withDefaults(
  defineProps<{
    photoId: number
    sortBy?: 'created_at' | 'likes_count'
    commentText?: string
  }>(),
  {
    sortBy: 'created_at',
    commentText: '',
  },
)

const emit = defineEmits<{
  (e: 'openInput'): void
}>()

const { isLoggedIn, requireLogin, isMe } = useAuth()

function handleOpenInput() {
  if (!requireLogin()) {
    return
  }
  emit('openInput')
}

const {
  data: commentPagesData,
  isLoading,
  isError,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  refetch,
} = useInfiniteCommentList(
  () => props.photoId,
  computed(() => ({ sort_by: props.sortBy })),
)

const commentsList = computed<CommentVM[]>(() => commentPagesData.value?.pages.flatMap(page => page.list) ?? [])

const deleteMutation = useDeleteComment(() => props.photoId)
const likeMutation = useSetCommentLike(() => props.photoId)

/** DELETE /comments/{id} 只允许本人，别人的评论不该出现删除入口且长按不响应 */
function canDelete(item: CommentVM) {
  if (!isLoggedIn())
    return false
  return isMe(item.author?.id)
}

function handleToggleLike(item: CommentVM) {
  if (!requireLogin()) {
    return
  }
  likeMutation.mutate({
    commentId: item.id,
    liked: !item.liked,
  })
}

const activeMenuCommentId = ref<number | null>(null)

function handleLongPress(item: CommentVM) {
  if (!canDelete(item))
    return
  activeMenuCommentId.value = item.id
}

function handleTriggerDelete(id: number) {
  activeMenuCommentId.value = null
  confirmDelete(id)
}

function confirmDelete(id: number) {
  uni.showModal({
    title: '提示',
    content: '确定要删除这条评论吗？',
    confirmColor: '#FA5151',
    confirmText: '删除',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        deleteMutation.mutate(id)
      }
    },
  })
}
</script>

<template>
  <view class="comment-section box-border h-full flex flex-col" @tap="activeMenuCommentId = null">
    <!-- 评论列表（滚动区：flex-1 撑满输入栏上方的剩余高度，杜绝内容不满时的底部留白） -->
    <scroll-view
      scroll-y
      :show-scrollbar="false"
      class="hide-scrollbar box-border min-h-0 w-full flex-1 pt-0"
      @tap="activeMenuCommentId = null"
    >
      <view v-if="isLoading" class="px-4 pt-2.5 space-y-3">
        <wd-skeleton animation="gradient" :row-col="[{ width: '100%', height: '50px' }]" />
      </view>
      <view v-else-if="isError" class="flex flex-col items-center justify-center gap-3 py-16">
        <wd-empty icon="network-error" tip="加载失败，请检查网络后重试" />
        <wd-button size="small" plain round @click="refetch">
          重新加载
        </wd-button>
      </view>
      <view v-else-if="commentsList.length" class="px-4 pt-2.5 space-y-3.5">
        <view
          v-for="(item, index) in commentsList"
          :key="item.id"
          class="relative flex items-start gap-3 border-b border-tx-border/30 rounded-xl px-1.5 pb-3.5 pt-1 transition-colors"
          :class="activeMenuCommentId === item.id ? 'z-30 bg-[#EFECE6] ring-1 ring-tx-brown/40 shadow-2xs' : 'active:bg-tx-surface'"
          @longpress.stop="handleLongPress(item)"
        >
          <!-- 朋友圈式主流长按 Popover 顶部/底部气泡菜单 (首条评论向下弹避免被 scroll-view 裁剪) -->
          <view
            v-if="activeMenuCommentId === item.id"
            class="absolute left-1/2 z-40 flex cursor-pointer items-center gap-2 rounded-xl bg-[#2C2C2C] px-4 py-2 text-white shadow-xl -translate-x-1/2 active:scale-95"
            :class="index === 0 ? 'top-full mt-2' : '-top-12'"
            @tap.stop="handleTriggerDelete(item.id)"
          >
            <text class="i-carbon:trash-can text-sm text-rose-400" />
            <text class="text-sm text-white font-bold">删除评论</text>
            <!-- 指向高亮评论框的小尖角 -->
            <view
              class="absolute left-1/2 h-2.5 w-2.5 rotate-45 bg-[#2C2C2C] -translate-x-1/2"
              :class="index === 0 ? '-top-1' : '-bottom-1'"
            />
          </view>

          <!-- 左侧头像 -->
          <wd-img
            custom-class="h-9 w-9 flex-shrink-0 rounded-full bg-slate-100 object-cover ring-1 ring-tx-border"
            :src="item.author.avatar || '/static/images/default-avatar.png'"
            lazy-load
            mode="aspectFill"
            round
            width="72rpx"
            height="72rpx"
          />

          <!-- 右侧主体：充满全宽 -->
          <view class="flex-1 space-y-1">
            <!-- 第一行：评论者昵称（与下文时间字体风格一致），本人增加高亮「我」角标，点赞按钮在右 -->
            <view class="flex items-center justify-between gap-2">
              <view class="min-w-0 flex items-center">
                <text class="truncate u-meta-time !text-tx-ink-3 !font-normal">{{ item.author.nickname }}</text>
                <text v-if="isMe(item.author.id)" class="ml-1 flex-shrink-0 rounded bg-tx-brown/15 px-1 py-0.2 text-[10px] text-tx-brown font-bold leading-none">我</text>
              </view>
              <like-button :liked="item.liked" :count="item.likesCount" icon-size="15px" font-size="12px" @click="handleToggleLike(item)" />
            </view>
            <!-- 第二行：评论正文（主要内容，醒目高亮） -->
            <text class="block py-0.5 u-body-main text-tx-ink">{{ item.content }}</text>
            <!-- 第三行：发布时间（与昵称同风尚浅虚色） -->
            <text class="block u-meta-time !text-tx-ink-3 !font-normal">{{ item.createdAt }}</text>
          </view>
        </view>

        <wd-button
          v-if="hasNextPage && !isFetchingNextPage"
          plain
          round
          block
          size="small"
          custom-class="!font-bold !my-2"
          @click="fetchNextPage()"
        >
          加载更多
        </wd-button>
        <wd-loadmore
          v-else-if="isFetchingNextPage"
          state="loading"
        />
      </view>
      <view v-else class="h-full flex flex-col items-center justify-center">
        <wd-empty icon="no-result" tip="暂无评论，快来抢沙发吧！" />
      </view>
    </scroll-view>

    <!-- 发表评论框（常驻底部：固定在评论区最底端，不随列表滚动，点击唤起抖音风格多行输入弹层） -->
    <view
      class="comment-bottom-bar box-border flex flex-shrink-0 select-none items-center gap-2.5 border-t border-tx-border/30 px-4 pt-3"
      hover-class="none"
      @tap="handleOpenInput"
    >
      <view class="flex-1 cursor-pointer" hover-class="none">
        <view class="box-border flex items-center border border-tx-border/60 rounded-xl bg-tx-surface p-2.5 text-base transition-colors active:bg-[#EFECE6]">
          <text v-if="commentText" class="truncate text-tx-ink">{{ commentText }}</text>
          <text v-else class="text-tx-ink-3">写下你的想法...</text>
        </view>
      </view>
      <wd-button
        type="warning"
        round
        size="small"
        custom-class="!font-black !bg-tx-brown !text-white !border-0 shadow-2xs !text-xs"
        @tap.stop="handleOpenInput"
      >
        发送
      </wd-button>
    </view>
  </view>
</template>
