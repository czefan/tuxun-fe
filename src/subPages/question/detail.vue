<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import SolveList from '@/features/attempt/components/solve-list.vue'
import MyAttemptList from '@/features/attempt/components/my-attempt-list.vue'
import CommentList from '@/features/comment/components/comment-list.vue'
import CommentInputPopup from '@/features/comment/components/comment-input-popup.vue'
import { useInfiniteCommentList, usePostComment } from '@/features/comment/query'
import { usePhotoDetail, useSetPhotoLike } from '@/features/photo/query'
import { useInfiniteMyAttemptsList, useInfiniteSolvesList } from '@/features/attempt/query'
import type { MyAttemptVM, SolveRecordVM } from '@/features/attempt/types'
import { useAuth } from '@/features/user/composables/use-auth'
import { AppRoute, withQuery } from '@/router/routes'
import { useStickyTop } from '@/composables/use-sticky-top'
import { closeActivePreviewImage, previewImage } from '@/utils/image-preview'
import { serverNow } from '@/utils/server-time'
import { formatCompactCount } from '@/utils/format-count'
import { useQuestionSwitcher } from './use-question-switcher'

definePage({
  style: {
    navigationBarTitleText: '%page.questionDetail%',
  },
})

const undoBannerStyle = useStickyTop(12)
const questionId = ref(0)
const activeTab = ref<'comments' | 'solves' | 'myAttempts'>('comments')

const {
  handleTouchStart,
  handleTouchEnd,
  switchQuestion,
  isSlideUping,
  isSlideDowning,
  showUndoBanner,
  initSwitcherFromQuery,
} = useQuestionSwitcher(questionId)

type CommentSortType = 'hottest' | 'latest'
const commentSortType = ref<CommentSortType>('hottest') // 默认即最多点赞
const showCommentSortPopover = ref(false)
// 映射到后端接口 sort_by：默认即最多点赞 ('likes_count')
const commentSortBy = computed(() => (commentSortType.value === 'latest' ? 'created_at' : 'likes_count'))

const detailTabsList = ['comments', 'solves', 'myAttempts'] as const
const currentTabIndex = computed(() => detailTabsList.indexOf(activeTab.value))

/** 点击包含评论和图标的整个 Tab 区域 */
function handleTabClick(tab: typeof detailTabsList[number]) {
  if (tab === 'comments' && activeTab.value === 'comments') {
    showCommentSortPopover.value = !showCommentSortPopover.value
  }
  else {
    activeTab.value = tab
    showCommentSortPopover.value = false
  }
}

const { isLoggedIn, isMe, loginDirectly, requireLogin } = useAuth()
const { mutate: setLike } = useSetPhotoLike()

const { data: question } = usePhotoDetail(computed(() => questionId.value))
const { data: commentPagesData } = useInfiniteCommentList(computed(() => questionId.value), computed(() => ({ sort_by: commentSortBy.value })))
const commentTotal = computed(() => commentPagesData.value?.pages[0]?.total ?? 0)

const commentInputVisible = ref(false)
const commentText = ref('')
const postCommentMutation = usePostComment(() => questionId.value)

function handleOpenCommentInput() {
  if (!requireLogin()) {
    return
  }
  commentInputVisible.value = true
}

function handlePostComment() {
  if (!requireLogin()) {
    return
  }
  if (!commentText.value.trim()) {
    uni.showToast({ title: '请输入评论内容', icon: 'none' })
    return
  }
  postCommentMutation.mutate(
    commentText.value.trim(),
    {
      onSuccess: () => {
        commentText.value = ''
        commentInputVisible.value = false
        uni.showToast({ title: '评论成功，等待审核', icon: 'none' })
      },
    },
  )
}

function handlePreviewImage() {
  if (question.value?.image?.originUrl) {
    previewImage(question.value.image.originUrl)
  }
}

// H5 下 previewImage 会往 history 压一条守卫记录用于拦截返回键。
// 若预览还开着页面就被卸载（比如点了页内跳转），这条记录会残留，
// 用户之后要按两次返回才退得出去。离开页面时主动收掉。
onUnload(() => {
  closeActivePreviewImage()
})

// 走 query hooks 而非直接调 api：作答/破解列表要在提交作答、点赞后按
// features/attempt/query.ts 里声明的失效规则自动刷新
const listParams = { page_size: 20 }
const {
  data: solvesPagesData,
  fetchNextPage: fetchNextSolves,
  hasNextPage: hasNextSolves,
  isFetchingNextPage: isFetchingSolves,
} = useInfiniteSolvesList(computed(() => questionId.value), listParams)

// 未登录时置 0 使 query 保持 disabled，避免打出必然 401 的请求
const myAttemptsPhotoId = computed(() => (isLoggedIn() ? questionId.value : 0))
const {
  data: myAttemptsPagesData,
  fetchNextPage: fetchNextMyAttempts,
  hasNextPage: hasNextMyAttempts,
  isFetchingNextPage: isFetchingMyAttempts,
} = useInfiniteMyAttemptsList(myAttemptsPhotoId, listParams)

const solves = computed<SolveRecordVM[]>(() => solvesPagesData.value?.pages.flatMap(page => page.list) ?? [])
const myAttempts = computed<MyAttemptVM[]>(() => myAttemptsPagesData.value?.pages.flatMap(page => page.list) ?? [])

onLoad((query) => {
  if (typeof query?.id === 'string')
    questionId.value = Number(query.id)

  initSwitcherFromQuery(query)

  // 互动消息跳转带 tab：评论消息/评论点赞 → 评论区、破解点赞 → 已破解
  if (query?.tab === 'solves' || query?.tab === 'myAttempts' || query?.tab === 'comments')
    activeTab.value = query.tab
})

const isEnded = computed(() => {
  const endTime = question.value?.activity?.endTime
  if (!endTime)
    return false
  const end = new Date(endTime).getTime()
  return Number.isFinite(end) && serverNow() >= end
})

const buttonState = computed(() => {
  if (!question.value)
    return { text: '我要答题', disabled: false }
  if (isEnded.value)
    return { text: '答题已结束', disabled: false }
  if (isMe(question.value.author?.id))
    return { text: '作者不可答题', disabled: true }
  if (question.value.userAttemptsCount >= 5)
    return { text: '次数上限 (5/5)', disabled: true }
  return { text: '我要答题', disabled: false }
})

function handleBottomAction() {
  if (isEnded.value) {
    uni.showToast({ title: question.value?.location ? '已定位到题目正确坐标' : '答题已结束，正确坐标整理中', icon: 'none' })
    return
  }
  if (isMe(question.value?.author?.id)) {
    uni.showToast({ title: '作者不可回答自己发布的题目', icon: 'none' })
    return
  }
  goSubmit()
}

function toggleLike() {
  if (requireLogin() && question.value) {
    setLike({ id: question.value.id, liked: !question.value.liked })
  }
}

function goSubmit() {
  if (!requireLogin() || !question.value)
    return
  if (question.value.userAttemptsCount >= 5) {
    uni.showToast({ title: '单题作答次数已达上限 (5/5)', icon: 'none' })
    return
  }
  uni.navigateTo({ url: withQuery(AppRoute.QuestionSubmit, { id: question.value.id }) })
}
</script>

<template>
  <!-- 页面根点击兜底关闭排序气泡 -->
  <view
    class="page-question-detail min-h-screen bg-tx-main transition-all"
    :class="{
      'animate-slide-up-out': isSlideUping,
      'animate-slide-down-out': isSlideDowning,
    }"
    @click="showCommentSortPopover = false"
  >
    <!-- 误触切题 4 秒内顶部弹出极简浅色撤销提示条 -->
    <view
      v-if="showUndoBanner"
      class="fixed left-4 right-4 z-50 flex animate-fade-in-down items-center justify-between border border-tx-border rounded-xl bg-white/95 px-4 py-2.5 text-sm text-[#332A22] shadow-2xl backdrop-blur-md"
      :style="undoBannerStyle"
    >
      <view class="flex items-center gap-2 font-medium">
        <text class="i-carbon:information text-base text-tx-brown" />
        <text>已为您切至下一题</text>
      </view>
      <view
        class="shadow-2xs flex cursor-pointer items-center gap-1.5 rounded-lg bg-tx-accent px-3 py-2 text-xs text-tx-ink font-bold transition-transform active:scale-95"
        @tap.stop="switchQuestion(-1)"
      >
        <text class="i-carbon:undo text-sm" />
        <text>撤销 / 上一题</text>
      </view>
    </view>
    <view v-if="question" class="flex flex-col gap-4 px-4 pb-0 pt-4">
      <!-- 题目核心卡片 (Single-Layer Card) -->
      <view class="shadow-2xs overflow-hidden border border-tx-border rounded-[18px] bg-white">
        <view class="relative w-full overflow-hidden">
          <wd-img
            custom-class="w-full cursor-pointer block"
            :style="{
              'view-transition-name': `photo-cover-${question.id}`,
              'aspectRatio': `${question.image.width} / ${question.image.height}`,
            }"
            :src="question.image.originUrl"
            lazy-load
            mode="widthFix"
            width="100%"
            @click="handlePreviewImage"
          />
        </view>

        <view class="p-5 space-y-3.5">
          <text class="block u-title-page leading-snug">{{ question.title }}</text>
          <text v-if="question.description" class="u-body-primary block">{{ question.description }}</text>

          <view v-if="question.activity?.title" class="pt-0.5">
            <text class="u-action-link text-base">#{{ question.activity.title }}</text>
          </view>

          <view class="flex items-center justify-between border-t border-tx-border/30 pt-3">
            <view class="flex items-center gap-2.5">
              <wd-img
                custom-class="h-9 w-9 rounded-full ring-2 ring-tx-border"
                :src="question.author.avatar || '/static/images/default-avatar.png'"
                lazy-load
                mode="aspectFill"
                round
                width="72rpx"
                height="72rpx"
              />
              <view class="flex flex-col">
                <view class="min-w-0 flex items-center">
                  <text class="truncate u-user-name font-bold">{{ question.author.nickname }}</text>
                  <text v-if="isMe(question.author.id)" class="ml-1 flex-shrink-0 rounded bg-tx-brown/15 px-1 py-0.2 text-[10px] text-tx-brown font-bold leading-none">我</text>
                </view>
                <text v-if="question.createdAt" class="mt-0.5 u-meta-time">{{ question.createdAt }}</text>
              </view>
            </view>
            <like-button :liked="question.liked" :count="question.likesCount" icon-size="20px" font-size="15px" @click="toggleLike" />
          </view>

          <!-- 主答题行动入口 (CTA Button) -->
          <view class="pt-1">
            <wd-button
              type="warning"
              round
              block
              size="large"
              custom-class="!font-black !bg-tx-accent !text-tx-ink !border-0 shadow-2xs active:scale-[0.99] transition-transform"
              :disabled="buttonState.disabled"
              @click="handleBottomAction"
            >
              {{ buttonState.text }}
            </wd-button>
          </view>
        </view>
      </view>

      <!-- 答案位置地图：在活动/答题已结束(isEnded)或本人投稿(isMe)且有坐标数据时展示答案正确坐标卡片 -->
      <photo-location-view
        v-if="(isEnded || isMe(question.author.id)) && question.location"
        :latitude="question.location.latitude"
        :longitude="question.location.longitude"
        :coord-type="question.location.coord_type"
      />

      <!-- 评论区、已破解与我的作答 3 合 1 可左右滑动相连卡片 -->
      <view class="shadow-2xs relative overflow-visible border border-tx-border rounded-[18px] bg-white pb-2 pt-3">
        <!-- 融入卡片顶部的无缝 Tab 标头：指示线无留白紧贴浅分割线 -->
        <view class="relative z-30 flex items-center justify-around px-4 pb-0 pt-1" style="border-bottom: 1px solid rgba(211, 186, 159, 0.5);">
          <view
            v-for="tab in [
              { value: 'comments', label: `评论 ${formatCompactCount(commentTotal)}` },
              { value: 'solves', label: `已破解 ${formatCompactCount(question?.solvedCount ?? 0)}` },
              { value: 'myAttempts', label: `我的作答 ${question?.userAttemptsCount ?? 0}` },
            ]"
            :key="tab.value"
            class="relative flex cursor-pointer items-center gap-1.5 pb-2.5 transition-colors active:opacity-75"
            :class="activeTab === tab.value ? 'u-tab-active' : 'u-tab-inactive'"
            @click.stop="handleTabClick(tab.value as any)"
          >
            <text>{{ tab.label }}</text>
            <!-- 评论右侧：上宽下窄 3 条横线图标 -->
            <view v-if="tab.value === 'comments'" class="ml-0.5 w-3.5 flex flex-col items-start justify-center gap-0.75">
              <view class="h-[2px] w-full rounded-full bg-tx-ink-2" />
              <view class="h-[2px] w-[70%] rounded-full bg-tx-ink-2" />
              <view class="h-[2px] w-[40%] rounded-full bg-tx-ink-2" />
            </view>

            <!-- 切换指示线：紧贴压在标头底部的浅分割线上 (-bottom-[1px])，无任何留白 -->
            <view
              v-if="activeTab === tab.value"
              class="absolute left-0 right-0 h-[2.5px] rounded-full bg-tx-brown -bottom-[1px]"
            />
          </view>
        </view>

        <!-- 评论排序下拉气泡 -->
        <view
          v-if="activeTab === 'comments' && showCommentSortPopover"
          class="absolute left-4 top-[52px] z-50 min-w-[132px] border border-tx-border/40 rounded-2xl bg-white p-2 text-left font-normal shadow-2xl space-y-1"
          @click.stop
        >
          <view
            v-for="opt in [{ key: 'hottest', label: '最多点赞' }, { key: 'latest', label: '最新' }] as const"
            :key="opt.key"
            class="flex cursor-pointer items-center justify-between rounded-xl px-3.5 py-2.5 text-sm transition-colors active:bg-tx-surface"
            :class="commentSortType === opt.key ? 'font-bold text-tx-ink' : 'text-[#555555]'"
            @click="() => { commentSortType = opt.key; showCommentSortPopover = false }"
          >
            <text>{{ opt.label }}</text>
            <text v-if="commentSortType === opt.key" class="i-carbon:checkmark text-base text-tx-brown font-bold" />
          </view>
        </view>

        <!-- Swiper 面板 -->
        <swiper
          class="h-[420px] w-full"
          :current="currentTabIndex"
          :duration="300"
          @change="(e: any) => { activeTab = detailTabsList[e.detail.current] as any; showCommentSortPopover = false }"
        >
          <swiper-item class="box-border">
            <CommentList
              v-if="questionId > 0"
              :photo-id="questionId"
              :sort-by="commentSortBy"
              :comment-text="commentText"
              @open-input="handleOpenCommentInput"
            />
          </swiper-item>
          <swiper-item class="box-border">
            <scroll-view scroll-y :show-scrollbar="false" class="hide-scrollbar box-border h-full w-full">
              <SolveList
                :list="solves"
                :photo-id="questionId"
                :has-next-page="hasNextSolves"
                :is-fetching-next-page="isFetchingSolves"
                @fetch-next-page="fetchNextSolves"
              />
            </scroll-view>
          </swiper-item>
          <swiper-item class="box-border">
            <view v-if="!isLoggedIn()" class="h-full flex flex-col items-center justify-center -mt-6">
              <wd-empty icon="no-result" tip="登录后查看我的作答" />
              <wd-button size="small" round type="warning" custom-class="!mt-4 !font-bold shadow-md" @click="loginDirectly">
                去登录
              </wd-button>
            </view>
            <scroll-view v-else scroll-y :show-scrollbar="false" class="hide-scrollbar box-border h-full w-full">
              <MyAttemptList
                :list="myAttempts"
                :has-next-page="hasNextMyAttempts"
                :is-fetching-next-page="isFetchingMyAttempts"
                @load-more="fetchNextMyAttempts"
              />
            </scroll-view>
          </swiper-item>
        </swiper>
      </view>

      <!-- 融入背景的全宽下部切题热区 -->
      <view
        class="mt-8 flex flex-col cursor-pointer items-center justify-center gap-1.5 pb-8 pt-6 text-tx-ink-2 transition-opacity -mx-4 active:opacity-75"
        @tap="switchQuestion(1)"
        @touchstart="handleTouchStart"
        @touchend="handleTouchEnd"
      >
        <view class="h-6 w-6 flex items-center justify-center rounded-full bg-tx-brown/20 text-tx-brown">
          <text class="i-carbon:arrow-up animate-bounce text-xs font-bold" />
        </view>
        <text class="text-xs font-bold">向上滑动或点击查看下一个题目</text>
      </view>
    </view>

    <!-- 抖音风格多行评论输入弹层（挂载在页面顶层，彻底脱离 swiper transform，实现全屏变暗遮罩） -->
    <CommentInputPopup
      v-model="commentText"
      v-model:visible="commentInputVisible"
      :loading="postCommentMutation.isPending.value"
      @submit="handlePostComment"
    />
  </view>
</template>

<style lang="scss" scoped>
@keyframes slideUpOut {
  from { transform: translateY(0); opacity: 1; }
  to { transform: translateY(-40px); opacity: 0.15; }
}
@keyframes slideDownOut {
  from { transform: translateY(0); opacity: 1; }
  to { transform: translateY(40px); opacity: 0.15; }
}
@keyframes fadeInDown {
  from { transform: translateY(-16px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.animate-slide-up-out { animation: slideUpOut 0.22s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
.animate-slide-down-out { animation: slideDownOut 0.22s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
.animate-fade-in-down { animation: fadeInDown 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
</style>
