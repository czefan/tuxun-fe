<template>
  <view
    class="m-[0_-14rpx] pt-12rpx"
    :class="{ 'pointer-events-none touch-none': isTransitionLocked }"
  >
    <view v-if="visibleActivities.length" :key="waterfallKey" class="flex items-start gap-8rpx">
      <view
        v-for="(column, columnIndex) in waterfallColumns"
        :key="columnIndex"
        class="activity-waterfall-list__column min-w-0 flex-1"
      >
        <activity-card
          v-for="item in column"
          :key="item.id"
          :item="item"
          :opening="openingQuestionId === item.id"
          @open="openQuestion"
        />
      </view>
    </view>

    <view v-else class="py-[80rpx_0_120rpx]">
      <wd-empty icon="no-result" tip="没有找到相关活动" />
    </view>

    <view v-if="visibleActivities.length" class="m-[22rpx_14rpx_18rpx] box-border min-h-88rpx flex items-center justify-center gap-18rpx px-10rpx">
      <view class="h-1rpx max-w-150rpx flex-1 bg-[#1f1b14]/12" />
      <text class="flex-shrink-0 text-25rpx text-[#81786c] font-normal leading-none">{{ nomoreText }}</text>
      <view class="h-1rpx max-w-150rpx flex-1 bg-[#1f1b14]/12" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { computed, getCurrentInstance, onMounted, ref } from 'vue'
import { useQuestionTransitionFlight } from '@/features/question-transition'
import { questionList } from '@/features/questions'
import type { QuestionCard } from '@/features/questions'
import { useQuestionLikeStore } from '@/store/questionLike'
import { runAfterPaint } from '@/utils'
import ActivityCard from './activity-card.vue'

type SortType = 'hot' | 'latest'

interface Props {
  nomoreText?: string
  searchKeyword?: string
  sortType?: SortType
  answerEnded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  nomoreText: '活动已加载完',
  searchKeyword: '',
  sortType: 'hot',
  answerEnded: false,
})

const instance = getCurrentInstance()
const questionLikeStore = useQuestionLikeStore()
const {
  openingQuestionId,
  isTransitionLocked,
  openQuestion: triggerOpenQuestion,
  handleShow,
} = useQuestionTransitionFlight(instance, (id) => {
  const question = questionList.find(item => item.id === id)

  return question
    ? {
        ...question,
        liked: questionLikeStore.getQuestionLiked(question.id, question.liked),
      }
    : null
})

const estimatedColumnWidth = ref(getDefaultEstimatedColumnWidth())

const visibleActivities = computed(() => {
  const keyword = props.searchKeyword.trim().toLowerCase()
  const filtered = keyword
    ? questionList.filter(item =>
        [item.title, item.author, item.overlayText ?? ''].some(value =>
          value.toLowerCase().includes(keyword),
        ),
      )
    : [...questionList]

  return filtered.sort((a, b) =>
    props.sortType === 'latest' ? b.createdAt - a.createdAt : b.heatValue - a.heatValue,
  )
})

const waterfallKey = computed(
  () =>
    `${props.searchKeyword}-${props.sortType}-${visibleActivities.value.map(item => item.id).join('-')}`,
)
const waterfallColumns = computed(() => distributeByEstimatedHeight(visibleActivities.value))

onMounted(() => {
  runAfterPaint(updateEstimatedColumnWidth)
})

onShow(() => {
  handleShow()
})

function openQuestion(item: QuestionCard) {
  triggerOpenQuestion({
    ...item,
    liked: questionLikeStore.getQuestionLiked(item.id, item.liked),
    answerEnded: props.answerEnded,
  })
}

function distributeByEstimatedHeight(items: QuestionCard[]) {
  const columns: [QuestionCard[], QuestionCard[]] = [[], []]
  const heights = [0, 0]

  const firstRowItems = items.slice(0, 2)
  const restItems = items.slice(2)

  firstRowItems.forEach((item, index) => {
    columns[index].push(item)
    heights[index] += getEstimatedCardHeight(item)
  })

  restItems.forEach((item) => {
    const targetIndex = getNextColumnIndex(columns, heights)
    columns[targetIndex].push(item)
    heights[targetIndex] += getEstimatedCardHeight(item)
  })

  return columns
}

function getNextColumnIndex(columns: [QuestionCard[], QuestionCard[]], heights: number[]) {
  const countBalanceHeightThreshold = 200
  const shorterIndex = heights[0] <= heights[1] ? 0 : 1
  const otherIndex = shorterIndex === 0 ? 1 : 0
  const nextCountDiff = columns[shorterIndex].length + 1 - columns[otherIndex].length
  const currentHeightDiff = Math.abs(heights[0] - heights[1])

  if (currentHeightDiff <= countBalanceHeightThreshold && Math.abs(nextCountDiff) > 1) {
    return otherIndex
  }

  return shorterIndex
}

function getEstimatedCardHeight(item: QuestionCard) {
  const bodyVerticalPadding = 28
  const titleHorizontalPadding = 32
  const titleFontSize = 30
  const titleLineSafetyRatio = 0.92
  const titleLineHeight = 43
  const titleCharsPerLine = Math.max(
    1,
    ((estimatedColumnWidth.value - titleHorizontalPadding) / titleFontSize) * titleLineSafetyRatio,
  )
  const titleLines = Math.min(
    2,
    Math.max(1, Math.ceil(getTextVisualLength(item.title) / titleCharsPerLine)),
  )
  const metaHeight = 38
  const metaMarginTop = 14
  const cardMarginBottom = 8
  const coverRatio = item.coverHeight / item.coverWidth

  return (
    coverRatio * estimatedColumnWidth.value
    + bodyVerticalPadding
    + titleLines * titleLineHeight
    + metaMarginTop
    + metaHeight
    + cardMarginBottom
  )
}

function getTextVisualLength(value: string) {
  return Array.from(value).reduce((length, char) => {
    return length + (char.charCodeAt(0) <= 255 ? 0.55 : 1)
  }, 0)
}

function getDefaultEstimatedColumnWidth() {
  const designWidth = 750
  const defaultPageHorizontalPadding = 24
  const waterfallHorizontalOverflow = 14 * 2
  const columnGap = 8

  return (designWidth - defaultPageHorizontalPadding * 2 + waterfallHorizontalOverflow - columnGap) / 2
}

function updateEstimatedColumnWidth() {
  // #ifdef H5
  const el = document.querySelector('.activity-waterfall-list__column')

  if (el) {
    const rect = el.getBoundingClientRect()
    setMeasuredColumnWidth(rect.width)
    return
  }
  // #endif

  // #ifndef H5
  uni
    .createSelectorQuery()
    .in(instance?.proxy)
    .select('.activity-waterfall-list__column')
    .boundingClientRect((rect) => {
      if (!rect || Array.isArray(rect)) {
        return
      }

      if (typeof rect.width === 'number') {
        setMeasuredColumnWidth(rect.width)
      }
    })
    .exec()
  // #endif
}

function setMeasuredColumnWidth(widthInPx: number) {
  if (!Number.isFinite(widthInPx) || widthInPx <= 0) {
    return
  }

  const windowWidth = uni.getWindowInfo().windowWidth

  if (!Number.isFinite(windowWidth) || windowWidth <= 0) {
    return
  }

  estimatedColumnWidth.value = (widthInPx * 750) / windowWidth
}
</script>
