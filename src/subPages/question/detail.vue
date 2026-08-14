<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { useQueryClient } from '@tanstack/vue-query'
import SolveList from '@/features/attempt/components/solve-list.vue'
import MyAttemptList from '@/features/attempt/components/my-attempt-list.vue'
import CommentList from '@/features/comment/components/comment-list.vue'
import { useInfiniteCommentList } from '@/features/comment/query'
import { usePhotoDetail, useSetPhotoLike } from '@/features/photo/query'
import { useInfiniteMyAttemptsList, useInfiniteSolvesList } from '@/features/attempt/query'
import type { MyAttemptVM, SolveRecordVM } from '@/features/attempt/types'
import { useAuth } from '@/features/user/composables/use-auth'
import { AppRoute, withQuery } from '@/router/routes'
import { qk } from '@/service/query/keys'
import { useStickyTop } from '@/composables/use-sticky-top'

import { closeActivePreviewImage, previewImage } from '@/utils/image-preview'
import { serverNow } from '@/utils/server-time'
import { formatCompactCount } from '@/utils/format-count'

definePage({
  style: {
    navigationBarTitleText: '%page.questionDetail%',
  },
})

const undoBannerStyle = useStickyTop(12)
const queryClient = useQueryClient()
const questionId = ref(0)
const activeTab = ref<'comments' | 'solves' | 'myAttempts'>('comments')
const isSlideUping = ref(false)
const isSlideDowning = ref(false)
const showUndoBanner = ref(false)
const touchStartY = ref(0)

/** 智能推算当前列表中位于下一个位置的题目 ID */
function getNextQuestionId(): number | null {
  const queries = queryClient.getQueriesData<any>({
    queryKey: qk.photo.all(),
  })
  for (const [_, data] of queries) {
    if (data?.pages) {
      const allPhotos = data.pages.flatMap((p: any) => p.list ?? [])
      const index = allPhotos.findIndex((p: any) => p.id === questionId.value)
      if (index !== -1 && index + 1 < allPhotos.length) {
        return allPhotos[index + 1].id
      }
    }
  }
  return null
}

/** 智能推算当前列表中位于上一个位置的题目 ID */
function getPrevQuestionId(): number | null {
  const queries = queryClient.getQueriesData<any>({
    queryKey: qk.photo.all(),
  })
  for (const [_, data] of queries) {
    if (data?.pages) {
      const allPhotos = data.pages.flatMap((p: any) => p.list ?? [])
      const index = allPhotos.findIndex((p: any) => p.id === questionId.value)
      if (index > 0) {
        return allPhotos[index - 1].id
      }
    }
  }
  return null
}

/** 切换到下一个题目 */
function handleGoNextQuestion() {
  if (isSlideUping.value || isSlideDowning.value)
    return
  const nextId = getNextQuestionId()
  if (!nextId) {
    uni.showToast({ title: '已是最后一题了', icon: 'none' })
    return
  }

  isSlideUping.value = true
  setTimeout(() => {
    uni.redirectTo({
      url: withQuery(AppRoute.QuestionDetail, { id: nextId, fromCut: 1 }),
      success: () => {
        isSlideUping.value = false
      },
      fail: () => {
        isSlideUping.value = false
      },
    })
  }, 220)
}

/** 切换回上一个题目 / 撤销误触切题 */
function handleGoPrevQuestion() {
  if (isSlideDowning.value || isSlideUping.value)
    return
  const prevId = getPrevQuestionId()
  if (!prevId) {
    uni.showToast({ title: '已是第一题了', icon: 'none' })
    return
  }

  showUndoBanner.value = false
  isSlideDowning.value = true
  setTimeout(() => {
    uni.redirectTo({
      url: withQuery(AppRoute.QuestionDetail, { id: prevId }),
      success: () => {
        isSlideDowning.value = false
      },
      fail: () => {
        isSlideDowning.value = false
      },
    })
  }, 220)
}

function handleTouchStart(e: TouchEvent) {
  if (e.touches && e.touches.length > 0) {
    touchStartY.value = e.touches[0].clientY
  }
}

function handleTouchEnd(e: TouchEvent) {
  if (e.changedTouches && e.changedTouches.length > 0) {
    const deltaY = e.changedTouches[0].clientY - touchStartY.value
    // 仅在专属长方形 Bar 内向上滑动超过 60px 触发
    if (deltaY < -60) {
      handleGoNextQuestion()
    }
  }
}

type CommentSortType = 'hottest' | 'latest'
const commentSortType = ref<CommentSortType>('hottest') // 默认即最多点赞
const showCommentSortPopover = ref(false)

// 映射到后端接口 sort_by：默认即最多点赞 ('likes_count')
const commentSortBy = computed(() => {
  if (commentSortType.value === 'latest') {
    return 'created_at'
  }
  return 'likes_count' // 默认即最多点赞
})

/** 点击包含评论和图标的整个 Tab 区域 */
function handleTabClick(tabValue: 'comments' | 'solves' | 'myAttempts') {
  if (tabValue === 'comments') {
    if (activeTab.value !== 'comments') {
      // 首次从其他 Tab 切换过来：仅进行 Tab 切换，显示评论内容，不弹气泡
      activeTab.value = 'comments'
      showCommentSortPopover.value = false
    }
    else {
      // 已经在评论界面：再次点击整个评论框，Toggle 弹出/收起筛选气泡
      showCommentSortPopover.value = !showCommentSortPopover.value
    }
  }
  else {
    activeTab.value = tabValue
    showCommentSortPopover.value = false
  }
}

function handleSelectCommentSort(sortType: CommentSortType) {
  commentSortType.value = sortType
  showCommentSortPopover.value = false
}

const detailTabsList = ['comments', 'solves', 'myAttempts'] as const

/** swiper 手势滑动切页时不走 handleTabClick，需在 change 里手动收起排序气泡 */
function handleSwiperChange(e: any) {
  activeTab.value = detailTabsList[e.detail.current] as any
  showCommentSortPopover.value = false
}

const { isLoggedIn, isMe, loginDirectly, requireLogin } = useAuth()
const { mutate: setLike } = useSetPhotoLike()

const currentTabIndex = computed(() => detailTabsList.indexOf(activeTab.value))

const { data: question } = usePhotoDetail(computed(() => questionId.value))
const { data: commentPagesData } = useInfiniteCommentList(computed(() => questionId.value), computed(() => ({ sort_by: commentSortBy.value })))
const commentTotal = computed(() => commentPagesData.value?.pages[0]?.total ?? 0)

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
  if (typeof query?.id === 'string') {
    questionId.value = Number(query.id)
  }
  // 互动消息跳转带 tab：评论消息/评论点赞 → 评论区、破解点赞 → 已破解
  // （见 pages/notice/index.vue handleInteractionTap；默认即为评论区，无需处理 undefined）
  if (query?.tab === 'solves' || query?.tab === 'myAttempts' || query?.tab === 'comments') {
    activeTab.value = query.tab
  }
  if (query?.fromCut === '1') {
    showUndoBanner.value = true
    setTimeout(() => {
      showUndoBanner.value = false
    }, 2000)
  }
})

const isEnded = computed(() => {
  const endTime = question.value?.activity?.endTime
  if (!endTime)
    return false
  const end = new Date(endTime).getTime()
  return Number.isFinite(end) && serverNow() >= end
})

const bottomButtonText = computed(() => {
  if (!question.value)
    return '我要答题'
  if (isEnded.value) {
    return '答题已结束'
  }
  if (isMe(question.value.author?.id)) {
    return '作者不可答题'
  }
  if (question.value.userAttemptsCount >= 5) {
    return '次数上限 (5/5)'
  }
  return '我要答题'
})

const isButtonDisabled = computed(() => {
  if (!question.value)
    return false
  if (isMe(question.value.author?.id)) {
    return true
  }
  if (!isEnded.value && question.value.userAttemptsCount >= 5) {
    return true
  }
  return false
})

function handleBottomAction() {
  if (isEnded.value) {
    if (question.value?.location) {
      uni.showToast({ title: '已定位到题目正确坐标', icon: 'none' })
    }
    else {
      uni.showToast({ title: '答题已结束，正确坐标整理中', icon: 'none' })
    }
    return
  }
  if (isMe(question.value?.author?.id)) {
    uni.showToast({ title: '作者不可回答自己发布的题目', icon: 'none' })
    return
  }
  goSubmit()
}

function toggleLike() {
  if (!requireLogin()) {
    return
  }
  if (question.value) {
    setLike({ id: question.value.id, liked: !question.value.liked })
  }
}

function goSubmit() {
  if (!requireLogin()) {
    return
  }
  if (question.value) {
    if (question.value.userAttemptsCount >= 5) {
      uni.showToast({ title: '单题作答次数已达上限 (5/5)', icon: 'none' })
      return
    }
    uni.navigateTo({ url: withQuery(AppRoute.QuestionSubmit, { id: question.value.id }) })
  }
}
</script>

<template>
  <!-- 页面根点击兜底关闭排序气泡 -->
  <view
    class="page-question-detail min-h-screen bg-[#F1DFC5] transition-all"
    :class="{
      'animate-slide-up-out': isSlideUping,
      'animate-slide-down-out': isSlideDowning,
    }"
    @click="showCommentSortPopover = false"
  >
    <!-- 误触切题 4 秒内顶部弹出极简浅色撤销提示条 -->
    <view
      v-if="showUndoBanner"
      class="fixed left-4 right-4 z-50 flex animate-fade-in-down items-center justify-between border border-[#D3BA9F] rounded-xl bg-white/95 px-4 py-2.5 text-xs text-[#332A22] shadow-2xl backdrop-blur-md"
      :style="undoBannerStyle"
    >
      <view class="flex items-center gap-1.5 font-medium">
        <text class="i-carbon:information text-sm text-[#B69171]" />
        <text>已为您切至下一题</text>
      </view>
      <view
        class="shadow-2xs flex cursor-pointer items-center gap-1 rounded-lg bg-[#F9DF95] px-2.5 py-1 text-[11px] text-[#1E1E1E] font-bold transition-transform active:scale-95"
        @tap.stop="handleGoPrevQuestion"
      >
        <text class="i-carbon:undo text-xs" />
        <text>撤销 / 上一题</text>
      </view>
    </view>
    <view v-if="question" class="px-4 pb-0 pt-4 space-y-4">
      <!-- 题目核心卡片 (Single-Layer Card) -->
      <view class="shadow-2xs overflow-hidden border border-[#D3BA9F] rounded-[18px] bg-white">
        <view class="relative">
          <wd-img
            custom-class="h-64 w-full cursor-pointer object-cover"
            :style="{ 'view-transition-name': `photo-cover-${question.id}` }"
            :src="question.image.originUrl"
            lazy-load
            mode="aspectFill"
            width="100%"
            height="512rpx"
            @click="handlePreviewImage"
          />
        </view>

        <view class="p-5 space-y-3.5">
          <text class="block u-title-page leading-snug">{{ question.title }}</text>
          <text v-if="question.description" class="u-body-primary block">{{ question.description }}</text>

          <view v-if="question.activity?.title" class="pt-0.5">
            <text class="u-action-link text-base">#{{ question.activity.title }}</text>
          </view>

          <view class="flex items-center justify-between border-t border-[#D3BA9F]/30 pt-3">
            <view class="flex items-center gap-2.5">
              <wd-img
                custom-class="h-9 w-9 rounded-full ring-2 ring-[#D3BA9F]"
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
                  <text v-if="isMe(question.author.id)" class="ml-1 flex-shrink-0 rounded bg-[#B69171]/15 px-1 py-0.2 text-[10px] text-[#B69171] font-bold leading-none">我</text>
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
              custom-class="!font-black !bg-[#F9DF95] !text-[#1E1E1E] !border-0 shadow-2xs active:scale-[0.99] transition-transform"
              :disabled="isButtonDisabled"
              @click="handleBottomAction"
            >
              {{ bottomButtonText }}
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
      <view class="shadow-2xs relative overflow-visible border border-[#D3BA9F] rounded-[18px] bg-white pb-2 pt-3">
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
              <view class="h-[2px] w-full rounded-full bg-[#756C5E]" />
              <view class="h-[2px] w-[70%] rounded-full bg-[#756C5E]" />
              <view class="h-[2px] w-[40%] rounded-full bg-[#756C5E]" />
            </view>

            <!-- 切换指示线：紧贴压在标头底部的浅分割线上 (-bottom-[1px])，无任何留白 -->
            <view
              v-if="activeTab === tab.value"
              class="absolute left-0 right-0 h-[2.5px] rounded-full bg-[#B69171] -bottom-[1px]"
            />
          </view>
        </view>

        <!-- 评论排序下拉气泡：提到与 swiper 同级，z-50 确保覆盖下方列表。
             52px 构成来源：标头 pt-1(4px) + tab 行高(≈24px) + pb-2.5(10px) + 分割线(1px) + 额外间距(≈13px) -->
        <view
          v-if="activeTab === 'comments' && showCommentSortPopover"
          class="absolute left-4 top-[52px] z-50 min-w-[132px] border border-[#D3BA9F]/40 rounded-2xl bg-white p-2 text-left font-normal shadow-2xl space-y-1"
          @click.stop
        >
          <view
            class="flex cursor-pointer items-center justify-between rounded-xl px-3.5 py-2.5 text-sm transition-colors active:bg-[#F8F6F2]"
            :class="commentSortType === 'hottest' ? 'font-bold text-[#1E1E1E]' : 'text-[#555555]'"
            @click="handleSelectCommentSort('hottest')"
          >
            <text>最多点赞</text>
            <text v-if="commentSortType === 'hottest'" class="i-carbon:checkmark text-base text-[#B69171] font-bold" />
          </view>

          <view
            class="flex cursor-pointer items-center justify-between rounded-xl px-3.5 py-2.5 text-sm transition-colors active:bg-[#F8F6F2]"
            :class="commentSortType === 'latest' ? 'font-bold text-[#1E1E1E]' : 'text-[#555555]'"
            @click="handleSelectCommentSort('latest')"
          >
            <text>最新</text>
            <text v-if="commentSortType === 'latest'" class="i-carbon:checkmark text-base text-[#B69171] font-bold" />
          </view>
        </view>

        <!-- Swiper 面板 -->
        <swiper
          class="h-[420px] w-full"
          :current="currentTabIndex"
          :duration="300"
          @change="handleSwiperChange"
        >
          <swiper-item class="box-border">
            <CommentList v-if="questionId > 0" :photo-id="questionId" :sort-by="commentSortBy" />
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

      <!-- 融入背景的全宽下部切题热区：死死压住最底部，与上卡片保持大方顶距 (mt-8) -->
      <view
        class="mt-8 flex flex-col cursor-pointer items-center justify-center gap-1.5 pb-8 pt-6 text-[#756C5E] transition-opacity -mx-4 active:opacity-75"
        @tap="handleGoNextQuestion"
        @touchstart="handleTouchStart"
        @touchend="handleTouchEnd"
      >
        <view class="h-6 w-6 flex items-center justify-center rounded-full bg-[#B69171]/20 text-[#B69171]">
          <text class="i-carbon:arrow-up animate-bounce text-xs font-bold" />
        </view>
        <text class="text-xs font-bold">向上滑动或点击查看下一个题目</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
@keyframes slideUpOut {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateY(-40px);
    opacity: 0.15;
  }
}

@keyframes slideDownOut {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateY(40px);
    opacity: 0.15;
  }
}

@keyframes fadeInDown {
  0% {
    transform: translateY(-16px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-up-out {
  animation: slideUpOut 0.22s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.animate-slide-down-out {
  animation: slideDownOut 0.22s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.animate-fade-in-down {
  animation: fadeInDown 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
</style>
