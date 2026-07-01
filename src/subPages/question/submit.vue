<template>
  <view class="page-answer">
    <view class="answer-question">
      <view class="answer-question__image-wrap" :style="questionImageStyle">
        <image
          class="answer-question__image"
          :src="questionCover"
          mode="aspectFill"
          @tap.stop="previewImage(questionCover)"
        />
      </view>
      <view class="answer-question__content">
        <text class="answer-question__label">当前题目</text>
        <text class="answer-question__title">{{ questionTitle }}</text>
      </view>
    </view>

    <view class="answer-form">
      <view class="form-field">
        <text class="form-label">现场照片</text>
        <view v-if="answerImage" class="answer-photo">
          <image
            class="answer-photo__image"
            :src="answerImage"
            mode="aspectFill"
            @tap.stop="previewImage(answerImage)"
          />
          <view class="answer-photo__change" @tap="chooseAnswerImage">
            <wd-icon name="camera" color="#1f1b14" size="24rpx" />
            <text class="answer-photo__change-text">重拍</text>
          </view>
        </view>
        <view v-else class="photo-picker" @tap="chooseAnswerImage">
          <wd-icon name="camera" color="#7c7468" size="48rpx" />
          <text class="photo-picker__text">拍摄或上传同机位照片</text>
        </view>
      </view>

      <form-location-picker
        v-model:address="answer.address"
        v-model:latitude="answer.latitude"
        v-model:longitude="answer.longitude"
        label="当前位置"
        selected-text="已选择位置"
        unselected-text="未选择位置"
      />
    </view>

    <view class="answer-bottom">
      <button class="answer-button" :disabled="isSubmitting" @tap="submitAnswerForm">
        {{ isSubmitting ? '提交中' : '提交答案' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useImagePicker, useSubmitGuard } from '@/composables/useSubmitFormTools'
import { getQuestionById } from '@/features/questions'
import { mockImageAssets } from '@/mocks/assets'
import { previewImage } from '@/utils'

definePage({
  style: {
    navigationBarTitleText: '%page.questionSubmit%',
  },
})

interface AnswerForm {
  address: string
  latitude: number
  longitude: number
  content: string
}

const questionId = ref(1)
const questionTitle = ref('图寻题目')
const questionCover = ref<string>(mockImageAssets.campus.gate.src)
const questionCoverWidth = ref<number>(mockImageAssets.campus.gate.width)
const questionCoverHeight = ref<number>(mockImageAssets.campus.gate.height)
const answer = reactive<AnswerForm>({
  address: '',
  latitude: 0,
  longitude: 0,
  content: '',
})

const {
  firstImage: answerImage,
  chooseImages: chooseAnswerImage,
} = useImagePicker({
  limit: 1,
  sourceType: ['camera', 'album'],
})
const { isSubmitting, submitWithGuard } = useSubmitGuard()
const questionImageStyle = computed(() => ({
  paddingBottom: `${(questionCoverHeight.value / questionCoverWidth.value) * 100}%`,
}))

onLoad((query) => {
  const rawId = Number(query?.id)
  questionId.value = Number.isFinite(rawId) && rawId > 0 ? rawId : 1

  const fallbackQuestion = getQuestionById(questionId.value)
  questionTitle.value
    = typeof query?.title === 'string' && query.title
      ? decodeURIComponent(query.title)
      : fallbackQuestion.title
  questionCover.value
    = typeof query?.cover === 'string' && query.cover
      ? decodeURIComponent(query.cover)
      : fallbackQuestion.cover
  const rawCoverWidth = Number(query?.coverWidth)
  const rawCoverHeight = Number(query?.coverHeight)
  questionCoverWidth.value
    = Number.isFinite(rawCoverWidth) && rawCoverWidth > 0
      ? rawCoverWidth
      : fallbackQuestion.coverWidth
  questionCoverHeight.value
    = Number.isFinite(rawCoverHeight) && rawCoverHeight > 0
      ? rawCoverHeight
      : fallbackQuestion.coverHeight
})

function submitAnswerForm() {
  submitWithGuard(validateAnswer)
}

function validateAnswer() {
  if (!answerImage.value) {
    return '请上传现场照片'
  }

  if (answer.latitude === 0 || answer.longitude === 0) {
    return '请选择当前位置'
  }

  return ''
}
</script>

<style scoped lang="scss">
.page-answer {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 28rpx 24rpx calc(28rpx + env(safe-area-inset-bottom));
  background: #f7f4ee;
  box-sizing: border-box;
}

.answer-question {
  overflow: hidden;
  background: #ffffff;
  border: 1rpx solid rgba(31, 27, 20, 0.07);
  border-radius: 18rpx;
  box-shadow: 0 10rpx 28rpx rgba(31, 27, 20, 0.05);
}

.answer-question__image-wrap {
  position: relative;
  overflow: hidden;
  background: #eeeeee;
}

.answer-question__image {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}

.answer-question__content {
  padding: 22rpx 24rpx 24rpx;
}

.answer-question__label,
.answer-question__title,
.form-label,
.field-tip,
.field-action__text,
.location-box__name,
.location-box__address,
.location-box__coord,
.answer-photo__change-text,
.photo-picker__text,
.form-count {
  display: block;
}

.answer-question__label {
  font-size: 22rpx;
  font-weight: 800;
  color: #9b7621;
}

.answer-question__title {
  margin-top: 8rpx;
  font-size: 32rpx;
  font-weight: 900;
  line-height: 1.35;
  color: #1f1b14;
}

.answer-form {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
  margin-top: 22rpx;
}

.field-tip {
  font-size: 22rpx;
  color: #9a9286;
}

.answer-photo,
.photo-picker {
  overflow: hidden;
  border-radius: 16rpx;
}

.answer-photo {
  position: relative;
  height: 420rpx;
  background: #eeeeee;
}

.answer-photo__image {
  width: 100%;
  height: 100%;
}

.answer-photo__change {
  position: absolute;
  right: 16rpx;
  bottom: 16rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
  height: 58rpx;
  padding: 0 20rpx;
  background: var(--tx-color-primary);
  border-radius: 999rpx;
}

.answer-photo__change-text {
  font-size: 24rpx;
  font-weight: 900;
  color: #1f1b14;
}

.photo-picker {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14rpx;
  height: 260rpx;
  background: #f8f6f2;
  border: 2rpx dashed rgba(31, 27, 20, 0.16);
  box-sizing: border-box;
}

.photo-picker__text {
  font-size: 24rpx;
  font-weight: 800;
  color: #7c7468;
}

.field-action {
  display: flex;
  align-items: center;
  gap: 6rpx;
  height: 52rpx;
  padding: 0 18rpx;
  background: var(--tx-color-primary);
  border-radius: 999rpx;
}

.field-action__text {
  font-size: 24rpx;
  font-weight: 900;
  color: #1f1b14;
}

.answer-bottom {
  margin-top: auto;
  padding: 40rpx 0 calc(20rpx + env(safe-area-inset-bottom));
}

.answer-button {
  width: 100%;
  height: 88rpx;
  padding: 0;
  font-size: 30rpx;
  font-weight: 900;
  line-height: 88rpx;
  color: #ffffff;
  background: #f56c6c;
  border: 0;
  border-radius: 999rpx;
}

.answer-button::after {
  border: 0;
}

.answer-button[disabled] {
  color: rgba(255, 255, 255, 0.72);
  background: #d8cbc0;
}
</style>
