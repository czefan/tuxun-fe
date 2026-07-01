<template>
  <view class="page-submit">
    <view v-if="!isPageReady" class="submit-loading">
      <wd-loading v-if="!hasLoadingError" type="circular" :color="BRAND_PRIMARY_COLOR" size="42rpx" />
      <text class="submit-loading__text">
        {{ hasLoadingError ? '页面加载失败' : '正在准备页面' }}
      </text>
      <button v-if="hasLoadingError" class="submit-loading__retry" @tap="preparePage">
        重试
      </button>
    </view>

    <template v-else>
      <view class="submit-hero">
        <view class="submit-hero__copy">
          <text class="submit-hero__title">投稿题目</text>
          <text class="submit-hero__subtitle">审核通过后进入公开题库</text>
        </view>
        <view class="submit-hero__badge">
          <text class="submit-hero__badge-text">图寻</text>
        </view>
      </view>

      <view class="submit-form">
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
            <text class="field-tip">{{ images.length }}/3</text>
          </view>
          <view class="image-grid">
            <view
              v-for="(image, index) in images"
              :key="image"
              class="image-tile"
            >
              <image
                class="image-tile__photo"
                :src="image"
                mode="aspectFill"
                @tap.stop="previewImage(image, images)"
              />
              <view class="image-tile__remove" @tap.stop="removeImage(index)">
                <wd-icon name="close" color="#ffffff" size="20rpx" />
              </view>
            </view>
            <view v-if="images.length < 3" class="image-add" @tap="chooseImages">
              <wd-icon name="camera" color="#7c7468" size="40rpx" />
              <text class="image-add__text">添加图片</text>
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

      <view class="submit-bottom">
        <button class="submit-button" :disabled="isSubmitting" @tap="submit">
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

<style scoped lang="scss">
.page-submit {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 28rpx 24rpx calc(28rpx + env(safe-area-inset-bottom));
  background: #f7f4ee;
  box-sizing: border-box;
}

.submit-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  flex-direction: column;
  gap: 22rpx;
  min-height: 70vh;
}

.submit-loading__text {
  display: block;
  font-size: 28rpx;
  font-weight: 800;
  color: #81786c;
}

.submit-loading__retry {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 180rpx;
  height: 68rpx;
  margin: 0;
  padding: 0;
  font-size: 26rpx;
  font-weight: 900;
  color: #1f1b14;
  background: var(--tx-color-primary);
  border: 0;
  border-radius: 999rpx;
}

.submit-loading__retry::after {
  border: 0;
}

.submit-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
  padding: 8rpx 6rpx 26rpx;
}

.submit-hero__copy {
  flex: 1;
  min-width: 0;
}

.submit-hero__title,
.submit-hero__subtitle,
.submit-hero__badge-text,
.form-label,
.field-tip,
.form-count,
.image-add__text,
.field-action__text,
.location-box__name,
.location-box__address,
.location-box__coord {
  display: block;
}

.submit-hero__title {
  font-size: 44rpx;
  font-weight: 900;
  line-height: 1.16;
  color: #1f1b14;
}

.submit-hero__subtitle {
  margin-top: 10rpx;
  font-size: 24rpx;
  line-height: 1.4;
  color: #81786c;
}

.submit-hero__badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 92rpx;
  height: 92rpx;
  background: #1f1b14;
  border-radius: 22rpx;
  box-shadow: 0 14rpx 32rpx rgba(31, 27, 20, 0.16);
}

.submit-hero__badge-text {
  font-size: 24rpx;
  font-weight: 900;
  color: var(--tx-color-primary);
}

.submit-form {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
}

.field-tip {
  font-size: 22rpx;
  color: #9a9286;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14rpx;
  margin-top: 18rpx;
}

.image-tile,
.image-add {
  position: relative;
  overflow: hidden;
  aspect-ratio: 1;
  border-radius: 16rpx;
}

.image-tile__photo {
  width: 100%;
  height: 100%;
}

.image-tile__remove {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40rpx;
  height: 40rpx;
  background: rgba(31, 27, 20, 0.72);
  border-radius: 999rpx;
}

.image-add {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  background: #f8f6f2;
  border: 2rpx dashed rgba(31, 27, 20, 0.16);
  box-sizing: border-box;
}

.image-add__text {
  font-size: 22rpx;
  font-weight: 800;
  color: #7c7468;
}

// Location picker styles are now scoped inside FormLocationPicker.vue

.submit-bottom {
  margin-top: auto;
  padding: 40rpx 0 calc(20rpx + env(safe-area-inset-bottom));
}

.submit-button {
  width: 100%;
  height: 88rpx;
  padding: 0;
  font-size: 30rpx;
  font-weight: 900;
  line-height: 88rpx;
  color: #1f1b14;
  background: var(--tx-color-primary);
  border: 0;
  border-radius: 999rpx;
}

.submit-button::after {
  border: 0;
}

.submit-button[disabled] {
  color: rgba(31, 27, 20, 0.58);
  background: #e7ddc9;
}
</style>
