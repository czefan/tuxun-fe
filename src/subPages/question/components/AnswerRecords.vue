<template>
  <view class="answer-records">
    <view class="answer-records__tabs">
      <view
        v-for="tab in recordTabs"
        :key="tab.key"
        class="answer-records__tab"
        :class="{ 'answer-records__tab--active': activeRecordTab === tab.key }"
        @tap="activeRecordTab = tab.key"
      >
        <text class="answer-records__tab-title">{{ tab.title }}</text>
        <text class="answer-records__tab-count">{{ tab.count }}</text>
        <view v-if="activeRecordTab === tab.key" class="answer-records__tab-line" />
      </view>
    </view>

    <template v-if="activeRecordTab === 'correct'">
      <view v-for="record in answerRecords" :key="record.id" class="answer-record">
        <view class="answer-record__top">
          <view class="answer-record__avatar">
            <text class="answer-record__avatar-text">{{ record.avatar }}</text>
          </view>
          <view class="answer-record__user">
            <text class="answer-record__name">{{ record.userName }}</text>
          </view>
        </view>

        <view class="answer-record__body">
          <view class="answer-record__image-wrap" :style="getRecordImageStyle(record)">
            <image
              class="answer-record__image"
              :src="record.image"
              mode="aspectFit"
              @tap.stop="previewImage(record.image, answerRecordImages)"
            />
          </view>
          <view class="answer-record__meta">
            <text class="answer-record__time">{{ record.answeredAt }}</text>
          </view>
        </view>
        <like-button
          :liked="isRecordLiked(record.id)"
          :count="getRecordLikes(record)"
          icon-size="34rpx"
          font-size="26rpx"
          class="answer-record__likes"
          @click="toggleRecordLike(record.id)"
        />
      </view>
    </template>

    <template v-else>
      <view
        v-for="record in myAnswerRecords"
        :key="record.id"
        class="answer-record answer-record--mine"
      >
        <view class="answer-record__top">
          <view class="answer-record__avatar answer-record__avatar--mine">
            <text class="answer-record__avatar-text">我</text>
          </view>
          <view class="answer-record__user">
            <text class="answer-record__name">我的作答</text>
          </view>
          <view class="answer-record__status">
            <status-tag :status="record.status" />
          </view>
        </view>

        <view class="answer-record__body">
          <view class="answer-record__image-wrap" :style="getRecordImageStyle(record)">
            <image
              class="answer-record__image"
              :src="record.image"
              mode="aspectFit"
              @tap.stop="previewImage(record.image, myAnswerRecordImages)"
            />
          </view>
          <view class="answer-record__meta">
            <text class="answer-record__time">{{ record.answeredAt }}</text>
          </view>
        </view>
        <like-button
          v-if="record.status === 'correct'"
          :liked="isRecordLiked(record.id)"
          :count="getRecordLikes(record)"
          icon-size="34rpx"
          font-size="26rpx"
          class="answer-record__likes"
          @click="toggleRecordLike(record.id)"
        />
      </view>
      <view v-if="!myAnswerRecords.length" class="answer-records__empty">
        <wd-empty icon="no-content" :tip="myAnswerRecordsEmptyText" />
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  getMyQuestionAnswerRecords,
  getQuestionAnswerRecords,
  myAnswerRecordLimit,
} from '@/features/questions'
import type { AnswerRecord, MyAnswerRecord } from '@/features/questions'
import { useAnswerRecordLikeStore } from '@/store'
import { useAuth } from '@/composables/useAuth'
import { usePrivateList } from '@/composables/usePrivateList'
import { getScaledRecordImageSize, previewImage } from '@/utils'

type RecordTabKey = 'correct' | 'mine'

const props = defineProps<{
  questionId: number
  questionCover: string
  questionCoverWidth: number
  questionCoverHeight: number
}>()

const answerRecordLikeStore = useAnswerRecordLikeStore()
const { ensureLogin } = useAuth()
const activeRecordTab = ref<RecordTabKey>('correct')
const answerRecords = computed(() =>
  getQuestionAnswerRecords(
    props.questionId,
    props.questionCover,
    props.questionCoverWidth,
    props.questionCoverHeight,
  ),
)
const { list: myAnswerRecords, emptyText: myAnswerRecordsEmptyText } = usePrivateList(
  () => getMyQuestionAnswerRecords(
    props.questionId,
    props.questionCover,
    props.questionCoverWidth,
    props.questionCoverHeight,
  ),
  '暂无作答记录',
)
const answerRecordImages = computed(() => answerRecords.value.map(record => record.image))
const myAnswerRecordImages = computed(() => myAnswerRecords.value.map(record => record.image))

const recordTabs = computed<Array<{ key: RecordTabKey, title: string, count: string }>>(() => [
  {
    key: 'correct',
    title: '作答成功',
    count: `${answerRecords.value.length} 人`,
  },
  {
    key: 'mine',
    title: '作答记录',
    count: `${myAnswerRecords.value.length}/${myAnswerRecordLimit}`,
  },
])

function getRecordImageStyle(record: AnswerRecord | MyAnswerRecord) {
  const size = getScaledRecordImageSize(record.imageWidth, record.imageHeight)

  return {
    width: `${size.width}rpx`,
    height: `${size.height}rpx`,
  }
}

function isRecordLiked(recordId: number) {
  return answerRecordLikeStore.getAnswerRecordLiked(recordId)
}

function getRecordLikes(record: AnswerRecord | MyAnswerRecord) {
  const base = record.likes ?? 0
  return isRecordLiked(record.id) ? base + 1 : base
}

async function toggleRecordLike(recordId: number) {
  if (!(await ensureLogin())) {
    return
  }

  answerRecordLikeStore.toggleAnswerRecordLiked(recordId)
}
</script>

<style lang="scss">
@import './AnswerRecords.scss';
</style>
