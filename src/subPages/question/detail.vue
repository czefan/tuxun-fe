<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { useQueryClient } from '@tanstack/vue-query'
import PhotoLocationView from '@/components/photo-location-view/photo-location-view.vue'
import CommentInputPopup from '@/features/comment/components/comment-input-popup.vue'
import QuestionHeroCard from '@/features/photo/components/question-hero-card.vue'
import QuestionDetailTabs from './components/question-detail-tabs.vue'
import { usePostComment } from '@/features/comment/query'
import { findCachedPhotoCard, usePhotoDetail, useSetPhotoLike } from '@/features/photo/query'
import { useAuth } from '@/features/user/composables/use-auth'
import { AppRoute, withQuery } from '@/router/routes'
import { useStickyTop } from '@/composables/use-sticky-top'
import { closeActivePreviewImage, previewImage } from '@/utils/image-preview'
import { serverNow } from '@/utils/server-time'
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

const { isMe, requireLogin } = useAuth()
const { mutate: setLike } = useSetPhotoLike()

const { data: question } = usePhotoDetail(computed(() => questionId.value))

const queryClient = useQueryClient()
const cachedCard = computed(() => findCachedPhotoCard(queryClient, questionId.value))

const thumbUrl = computed(() => {
  if (cachedCard.value?.image?.url) {
    return cachedCard.value.image.url
  }
  if (question.value?.image?.url && question.value.image.url !== question.value.image.originUrl) {
    return question.value.image.url
  }
  return null
})

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
  postCommentMutation.mutate(commentText.value.trim(), {
    onSuccess: () => {
      commentText.value = ''
      commentInputVisible.value = false
      uni.showToast({ title: '评论成功，等待审核', icon: 'none' })
    },
  })
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

onLoad((query) => {
  if (typeof query?.id === 'string') questionId.value = Number(query.id)

  initSwitcherFromQuery(query)

  // 互动消息跳转带 tab：评论消息/评论点赞 → 评论区、破解点赞 → 已破解
  if (query?.tab === 'solves' || query?.tab === 'myAttempts' || query?.tab === 'comments')
    activeTab.value = query.tab
})

const isEnded = computed(() => {
  const endTime = question.value?.activity?.endTime
  if (!endTime) return false
  const end = new Date(endTime).getTime()
  return Number.isFinite(end) && serverNow() >= end
})

const buttonState = computed(() => {
  if (!question.value) return { text: '我要答题', disabled: false }
  if (isEnded.value) return { text: '答题已结束', disabled: true }
  if (isMe(question.value.author?.id)) return { text: '作者不可答题', disabled: true }
  if (question.value.userAttemptsCount >= 5) return { text: '次数上限 (5/5)', disabled: true }
  return { text: '我要答题', disabled: false }
})

function handleBottomAction() {
  if (isEnded.value) {
    uni.showToast({
      title: question.value?.location ? '已定位到题目正确坐标' : '答题已结束，正确坐标整理中',
      icon: 'none',
    })
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
  if (!requireLogin() || !question.value) return
  if (question.value.userAttemptsCount >= 5) {
    uni.showToast({ title: '单题作答次数已达上限 (5/5)', icon: 'none' })
    return
  }
  uni.navigateTo({ url: withQuery(AppRoute.QuestionSubmit, { id: question.value.id }) })
}
</script>

<template>
  <view
    class="page-question-detail min-h-screen bg-tx-main transition-all"
    :class="{
      'animate-slide-up-out': isSlideUping,
      'animate-slide-down-out': isSlideDowning,
    }"
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
      <!-- 题目核心卡片 -->
      <QuestionHeroCard
        :question="question"
        :thumb-url="thumbUrl"
        :is-me="isMe(question.author?.id)"
        :button-state="buttonState"
        @preview-image="handlePreviewImage"
        @toggle-like="toggleLike"
        @action="handleBottomAction"
      />

      <!-- 答案位置地图：在活动/答题已结束(isEnded)或本人投稿(isMe)且有坐标数据时展示答案正确坐标卡片 -->
      <photo-location-view
        v-if="(isEnded || isMe(question.author.id)) && question.location"
        :latitude="question.location.latitude"
        :longitude="question.location.longitude"
        :coord-type="question.location.coord_type"
      />

      <!-- 评论区、已破解与我的作答 3 合 1 Tab 卡片 -->
      <QuestionDetailTabs
        :question-id="questionId"
        :solved-count="question.solvedCount"
        :user-attempts-count="question.userAttemptsCount"
        :initial-tab="activeTab"
        :comment-text="commentText"
        @open-comment-input="handleOpenCommentInput"
      />

      <!-- 融入背景的全宽下部切题热区 -->
      <view
        class="mt-8 flex flex-col cursor-pointer items-center justify-center gap-1.5 pb-8 pt-6 text-tx-ink-2 transition-opacity -mx-4 active:opacity-75"
        @tap="switchQuestion(1)"
        @touchstart="handleTouchStart"
        @touchend="handleTouchEnd"
      >
        <view
          class="h-6 w-6 flex items-center justify-center rounded-full bg-tx-brown/20 text-tx-brown"
        >
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

<style scoped>
@keyframes slideUpOut {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(-40px);
    opacity: 0.15;
  }
}
@keyframes slideDownOut {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(40px);
    opacity: 0.15;
  }
}
@keyframes fadeInDown {
  from {
    transform: translateY(-16px);
    opacity: 0;
  }
  to {
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
