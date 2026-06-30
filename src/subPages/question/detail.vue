<template>
  <view
    class="page-question-detail"
    :class="{ 'page-question-detail--entering': isEnterTransitionActive }"
  >
    <view class="question-detail__stage">
      <custom-nav-bar
        class="question-detail__nav"
        title="题目详情"
        :fixed="false"
        custom-back
        @back="goBack"
      />
      <view class="question-detail__hero" :style="questionHeroStyle">
        <image
          class="question-detail__hero-image"
          :src="question.cover"
          mode="aspectFill"
          @tap.stop="previewImage(question.cover)"
        />
        <view v-if="question.overlayText || question.isVideo" class="question-detail__hero-mask" />
        <text v-if="question.overlayText" class="question-detail__overlay-text">
          {{ question.overlayText }}
        </text>
      </view>

      <view class="question-detail__content">
        <text class="question-detail__title">{{ question.title }}</text>
        <view class="question-detail__author">
          <view class="question-detail__avatar">
            <text class="question-detail__avatar-text">{{ question.avatar }}</text>
          </view>
          <view class="question-detail__author-info">
            <text class="question-detail__author-name">{{ question.author }}</text>
          </view>
        </view>
        <text class="question-detail__body">{{ question.body }}</text>
      </view>

      <answer-records
        :question-id="question.id"
        :question-cover="question.cover"
        :question-cover-width="question.coverWidth"
        :question-cover-height="question.coverHeight"
      />
    </view>

    <view class="fixed-bottom-bar question-detail__bottom">
      <view
        class="question-detail__button"
        :class="{ 'question-detail__button--ended': isAnswerEnded }"
        @tap="goAnswer"
      >
        <text class="question-detail__button-text">{{ answerButtonText }}</text>
      </view>
      <like-button
        :liked="liked"
        :count="displayedHeat"
        size="lg"
        class="question-detail__like"
        @click="toggleLike"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { onBackPress, onLoad, onReady, onUnload } from '@dcloudio/uni-app'
import AnswerRecords from './components/AnswerRecords.vue'
import { useQuestionTransitionStore } from '@/features/question-transition'
import type { QuestionTransitionViewportSnapshot } from '@/features/question-transition'
import { useQuestionLikeStore } from '@/store/questionLike'
import { getQuestionById } from '@/features/questions'
import { useAuth } from '@/composables/useAuth'
import { getDisplayedHeat, getPageScrollTop, handleImagePreviewBack, previewImage, runAfterPaint } from '@/utils'
import { AppRoute, withQuery } from '@/router/routes'

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '%page.questionDetail%',
  },
})

const transitionStore = useQuestionTransitionStore()
const questionLikeStore = useQuestionLikeStore()
const { ensureLogin } = useAuth()
const questionId = ref(1)
const isAnswerEnded = ref(false)
const isReturning = ref(false)
const hasRevealedEnterPage = ref(false)

let h5DetailHistoryUrl = ''
let h5DetailHistoryState: unknown = null
let h5PopStateBound = false
let h5BackGuardPushed = false

const question = computed(() => getQuestionById(questionId.value))
const liked = computed(() => questionLikeStore.getQuestionLiked(question.value.id, question.value.liked))
const questionHeroStyle = computed(() => ({
  paddingBottom: `${(question.value.coverHeight / question.value.coverWidth) * 100}%`,
}))
const isEnterTransitionActive = computed(() => {
  const flight = transitionStore.flight

  return (
    !hasRevealedEnterPage.value
    && flight?.mode === 'enter'
    && flight.question.id === questionId.value
  )
})
const displayedHeat = computed(() => getDisplayedHeat(question.value.heat, liked.value))
const answerButtonText = computed(() => (isAnswerEnded.value ? '答题已结束' : '我要答题'))

onLoad((query) => {
  const rawId = Number(query?.id)

  questionId.value = Number.isFinite(rawId) && rawId > 0 ? rawId : 1
  isAnswerEnded.value = query?.answerEnded === '1' || Boolean(question.value.answerEnded)
  questionLikeStore.ensureQuestionLiked(question.value.id, question.value.liked)
  hasRevealedEnterPage.value = false
})

onReady(() => {
  revealEnteredPage()
})

onMounted(() => {
  bindH5SystemBackGuard()
})

onBeforeUnmount(() => {
  unbindH5SystemBackGuard()
})

onUnload(() => {
  unbindH5SystemBackGuard()
})

onBackPress((event) => {
  if (handleImagePreviewBack()) {
    return true
  }

  if (event?.from === 'navigateBack') {
    return false
  }

  if (isReturning.value) {
    return true
  }

  if (canUseReturnTransition()) {
    startReturnTransition()
    return true
  }

  return false
})

function goBack() {
  if (isReturning.value) {
    return
  }

  // #ifdef H5
  if (h5BackGuardPushed && canUseReturnTransition()) {
    window.history.back()
    return
  }
  // #endif

  if (canUseReturnTransition()) {
    startReturnTransition()
    return
  }

  uni.navigateBack()
}

async function goAnswer() {
  if (isAnswerEnded.value) {
    return
  }

  if (!(await ensureLogin())) {
    return
  }

  uni.navigateTo({
    url: withQuery(AppRoute.QuestionSubmit, {
      id: question.value.id,
      title: question.value.title,
      cover: question.value.cover,
      coverWidth: question.value.coverWidth,
      coverHeight: question.value.coverHeight,
    }),
  })
}

async function toggleLike() {
  if (!(await ensureLogin())) {
    return
  }

  questionLikeStore.toggleQuestionLiked(question.value.id, question.value.liked)
}

function revealEnteredPage() {
  const flight = transitionStore.flight

  if (!flight || flight.mode !== 'enter' || flight.question.id !== questionId.value) {
    return
  }

  hasRevealedEnterPage.value = true
  runAfterPaint(() => {
    transitionStore.clearFlight()
    hasRevealedEnterPage.value = false
    unlockPageScroll()
  })
}

function canUseReturnTransition() {
  const snapshot = transitionStore.snapshot

  return Boolean(snapshot && snapshot.questionId === questionId.value)
}

function startReturnTransition() {
  isReturning.value = true
  transitionStore.startFlight(
    'leave',
    {
      ...question.value,
      answerEnded: isAnswerEnded.value,
      liked: liked.value,
    },
    transitionStore.snapshot?.rect ?? null,
    getPageScrollTop(),
    getViewportSnapshot(),
  )
  transitionStore.markPendingReturn(questionId.value)

  setTimeout(() => {
    const delta = getReturnNavigateDelta()

    uni.navigateBack({
      delta,
      animationType: 'none',
      animationDuration: 0,
      fail: () => {
        isReturning.value = false
        transitionStore.clearPendingReturn()
        transitionStore.clearFlight()
      },
    })
  }, 0)
}

function bindH5SystemBackGuard() {
  // #ifdef H5
  if (h5PopStateBound || !canUseReturnTransition()) {
    return
  }

  h5DetailHistoryUrl = window.location.href
  h5DetailHistoryState = window.history.state
  window.history.pushState(getH5BackGuardState(h5DetailHistoryState), '', h5DetailHistoryUrl)
  window.addEventListener('popstate', handleH5PopState, true)
  h5PopStateBound = true
  h5BackGuardPushed = true
  // #endif
}

function unbindH5SystemBackGuard() {
  // #ifdef H5
  if (!h5PopStateBound) {
    return
  }

  window.removeEventListener('popstate', handleH5PopState, true)
  h5PopStateBound = false
  // #endif
}

function handleH5PopState(event: PopStateEvent) {
  // #ifdef H5
  h5BackGuardPushed = false

  if (isReturning.value || !canUseReturnTransition()) {
    return
  }

  event.preventDefault()
  event.stopImmediatePropagation()
  startReturnTransition()
  // #endif
}

function getReturnNavigateDelta() {
  let delta = 1

  // #ifdef H5
  if (h5BackGuardPushed) {
    h5BackGuardPushed = false
    delta = 2
  }

  unbindH5SystemBackGuard()
  // #endif

  return delta
}

function getH5BackGuardState(state: unknown) {
  const guardState = {
    __questionTransitionBackGuard: true,
  }

  if (!state || typeof state !== 'object') {
    return guardState
  }

  return {
    ...(state as Record<string, unknown>),
    ...guardState,
  }
}

function getViewportSnapshot(): QuestionTransitionViewportSnapshot | null {
  // #ifdef H5
  const element = document.querySelector<HTMLElement>('.page-question-detail')

  if (!element) {
    return null
  }

  const clone = element.cloneNode(true) as HTMLElement
  clone.querySelector('.question-detail__bottom')?.remove()

  return {
    html: clone.outerHTML,
    height: element.scrollHeight || element.getBoundingClientRect().height,
  }
  // #endif

  // #ifndef H5
  return null
  // #endif
}

function unlockPageScroll() {
  // #ifdef H5
  document.body.style.overflow = ''
  // #endif
}
</script>

<style lang="scss">
@import './detail.scss';
</style>
