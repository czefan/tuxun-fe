<template>
  <view class="page-answer box-border min-h-100vh flex flex-col bg-[#f7f4ee] p-[28rpx_24rpx_calc(28rpx+env(safe-area-inset-bottom))]">
    <view class="overflow-hidden border border-[rgba(31,27,20,0.07)] rounded-18rpx border-solid bg-white shadow-[0_10rpx_28rpx_rgba(31,27,20,0.05)]">
      <view class="relative overflow-hidden bg-[#eeeeee]" :style="questionImageStyle">
        <image
          class="absolute inset-0 block h-full w-full"
          :src="questionCover"
          mode="aspectFill"
          @tap.stop="previewImage(questionCover)"
        />
      </view>
      <view class="p-[22rpx_24rpx_24rpx]">
        <text class="block text-22rpx text-[#9b7621] font-800">当前题目</text>
        <text class="mt-8rpx block text-32rpx text-[#1f1b14] font-900 leading-[1.35]">{{ questionTitle }}</text>
      </view>
    </view>

    <view class="answer-form mt-22rpx flex flex-col gap-22rpx">
      <view class="form-field">
        <text class="form-label">现场照片</text>
        <view v-if="answerImage" class="relative h-420rpx overflow-hidden rounded-16rpx bg-[#eeeeee]">
          <image
            class="h-full w-full"
            :src="answerImage"
            mode="aspectFill"
            @tap.stop="previewImage(answerImage)"
          />
          <view class="absolute bottom-16rpx right-16rpx h-58rpx flex cursor-pointer items-center gap-8rpx rounded-full bg-brand px-20rpx" @tap="chooseAnswerImage">
            <wd-icon name="camera" color="#1f1b14" size="24rpx" />
            <text class="block text-24rpx text-[#1f1b14] font-900">重拍</text>
          </view>
        </view>
        <view v-else class="box-border h-260rpx flex flex-col cursor-pointer items-center justify-center gap-14rpx overflow-hidden border-2rpx border-[rgba(31,27,20,0.16)] rounded-16rpx border-dashed bg-[#f8f6f2]" @tap="chooseAnswerImage">
          <wd-icon name="camera" color="#7c7468" size="48rpx" />
          <text class="block text-24rpx text-[#7c7468] font-800">拍摄或上传同机位照片</text>
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

    <view class="mt-auto p-[40rpx_0_calc(20rpx+env(safe-area-inset-bottom))]">
      <button class="h-88rpx w-full border-0 rounded-full bg-[#f56c6c] p-0 text-30rpx text-white font-900 leading-88rpx after:border-0 disabled:(bg-[#d8cbc0] text-white/72)" :disabled="isSubmitting" @tap="submitAnswerForm">
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
