<template>
  <view class="page-submit box-border min-h-100vh flex flex-col bg-[#f7f4ee] p-[28rpx_24rpx_calc(28rpx+env(safe-area-inset-bottom))]">
    <view v-if="!isPageReady" class="min-h-70vh flex flex-1 flex-col items-center justify-center gap-22rpx">
      <wd-loading v-if="!hasLoadingError" type="circular" :color="BRAND_PRIMARY_COLOR" size="42rpx" />
      <text class="block text-28rpx text-[#81786c] font-800">
        {{ hasLoadingError ? '页面加载失败' : '正在准备页面' }}
      </text>
      <button v-if="hasLoadingError" class="m-0 h-68rpx w-180rpx flex items-center justify-center border-0 rounded-full bg-brand p-0 text-26rpx text-[#1f1b14] font-900 after:border-0" @tap="preparePage">
        重试
      </button>
    </view>

    <template v-else>
      <view class="flex items-start justify-between gap-20rpx p-[8rpx_6rpx_26rpx]">
        <view class="min-w-0 flex-1">
          <text class="block text-44rpx text-[#1f1b14] font-900 leading-[1.16]">投稿题目</text>
          <text class="mt-10rpx block text-24rpx text-[#81786c] leading-1.4">审核通过后进入公开题库</text>
        </view>
        <view class="h-92rpx w-92rpx flex items-center justify-center rounded-22rpx bg-[#1f1b14] shadow-[0_14rpx_32rpx_rgba(31,27,20,0.16)]">
          <text class="block text-24rpx text-brand font-900">图寻</text>
        </view>
      </view>

      <view class="submit-form flex flex-col gap-22rpx">
        <view class="form-field">
          <text class="form-label">题目标题</text>
          <input
            v-model.trim="form.title"
            class="form-input"
            :maxlength="24"
            placeholder="例如：午后走廊的光"
            placeholder-class="form-placeholder"
          >
        </view>

        <view class="form-field">
          <text class="form-label">题目描述</text>
          <textarea
            v-model.trim="form.description"
            class="form-textarea"
            :maxlength="80"
            placeholder="补充画面特征或安全提示"
            placeholder-class="form-placeholder"
            auto-height
          />
          <text class="form-count">{{ form.description.length }}/80</text>
        </view>

        <view class="form-field">
          <view class="field-top">
            <text class="form-label">题目图片</text>
            <text class="block text-22rpx text-[#9a9286]">{{ images.length }}/3</text>
          </view>
          <view class="grid grid-cols-3 mt-18rpx gap-14rpx">
            <view
              v-for="(image, index) in images"
              :key="image"
              class="relative aspect-square overflow-hidden rounded-16rpx"
            >
              <image
                class="h-full w-full"
                :src="image"
                mode="aspectFill"
                @tap.stop="previewImage(image, images)"
              />
              <view class="absolute right-8rpx top-8rpx h-40rpx w-40rpx flex cursor-pointer items-center justify-center rounded-full bg-[#1f1b14]/72" @tap.stop="removeImage(index)">
                <wd-icon name="close" color="#ffffff" size="20rpx" />
              </view>
            </view>
            <view v-if="images.length < 3" class="relative box-border aspect-square flex flex-col cursor-pointer items-center justify-center gap-10rpx overflow-hidden border-2rpx border-[rgba(31,27,20,0.16)] rounded-16rpx border-dashed bg-[#f8f6f2]" @tap="chooseImages">
              <wd-icon name="camera" color="#7c7468" size="40rpx" />
              <text class="block text-22rpx text-[#7c7468] font-800">添加图片</text>
            </view>
          </view>
        </view>

        <form-location-picker
          v-model:address="form.address"
          v-model:latitude="form.latitude"
          v-model:longitude="form.longitude"
          label="地点"
          selected-text="已选择地点"
          unselected-text="未选择地点"
        />

        <view class="form-field">
          <text class="form-label">联系方式（选填）</text>
          <input
            v-model.trim="form.contact"
            class="form-input"
            :maxlength="40"
            placeholder="微信、QQ 或手机号"
            placeholder-class="form-placeholder"
          >
        </view>
      </view>

      <view class="mt-auto p-[40rpx_0_calc(20rpx+env(safe-area-inset-bottom))]">
        <button class="h-88rpx w-full border-0 rounded-full bg-brand p-0 text-30rpx text-[#1f1b14] font-900 leading-88rpx after:border-0 disabled:(text-[#1f1b14]/58_bg-[#e7ddc9])" :disabled="isSubmitting" @tap="submit">
          {{ isSubmitting ? '提交中' : '提交投稿' }}
        </button>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { BRAND_PRIMARY_COLOR } from '@/styles/constants'
import { useAuth } from '@/composables/useAuth'
import { useImagePicker, useSubmitGuard } from '@/composables/useSubmitFormTools'
import { previewImage } from '@/utils'

definePage({
  style: {
    navigationBarTitleText: '%page.contribute%',
  },
})

interface SubmitForm {
  title: string
  description: string
  contact: string
  address: string
  latitude: number
  longitude: number
}

const form = reactive<SubmitForm>({
  title: '',
  description: '',
  contact: '',
  address: '',
  latitude: 0,
  longitude: 0,
})

const { ensureLogin } = useAuth()
const isPageReady = ref(false)
const hasLoadingError = ref(false)
const isUnmounted = ref(false)
const { images, chooseImages, removeImage } = useImagePicker({
  limit: 3,
  sourceType: ['album', 'camera'],
})
const { isSubmitting, submitWithGuard } = useSubmitGuard()

onLoad(() => {
  preparePage()
})

onUnload(() => {
  isUnmounted.value = true
})

async function preparePage() {
  hasLoadingError.value = false

  try {
    const canEnter = await ensureLogin()

    if (isUnmounted.value) {
      return
    }

    if (!canEnter) {
      return
    }

    isPageReady.value = true
  }
  catch (error) {
    if (isUnmounted.value || isSilentAuthError(error)) {
      return
    }

    hasLoadingError.value = true
  }
}

function submit() {
  submitWithGuard(validateForm)
}

function validateForm() {
  if (!form.title) {
    return '请填写标题'
  }

  if (!form.description) {
    return '请填写描述'
  }

  if (images.value.length === 0) {
    return '请添加图片'
  }

  if (form.latitude === 0 || form.longitude === 0) {
    return '请选择地点'
  }

  return ''
}

function isSilentAuthError(error: unknown) {
  return !!error && typeof error === 'object' && (error as { isSilent?: boolean }).isSilent === true
}
</script>
