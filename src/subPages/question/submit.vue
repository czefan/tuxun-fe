<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useSubmitAttempt } from '@/features/attempt/query'
import { useAuth } from '@/composables/use-auth'
import { AppRoute, withQuery } from '@/router/routes'
import { smartCompressImage, validateImageAspectRatio } from '@/utils/image-compress'
import { TX_BG_BROWN } from '@/styles/constants'

import { DEFAULT_COORD_TYPE, isSubmittableLocation } from '@/composables/use-map'

definePage({
  style: {
    navigationBarTitleText: '%page.questionSubmit%',
  },
})

const { requireLogin } = useAuth()

const photoId = ref(0)
const loading = ref(false)
const formData = reactive({
  filePath: '',
  address: '',
  latitude: 0,
  longitude: 0,
  coordType: DEFAULT_COORD_TYPE as 'wgs84' | 'gcj02',
})

const DRAFT_KEY_PREFIX = 'tuxun_submit_attempt_draft_'

const submitMutation = useSubmitAttempt(() => photoId.value)

onLoad((query) => {
  if (typeof query?.id === 'string') {
    photoId.value = Number(query.id)
    checkDraft()
  }
})

function isSubmitDraftMeaningful(data: any): boolean {
  if (!data || typeof data !== 'object')
    return false
  return Boolean(data.filePath || isSubmittableLocation(data.latitude, data.longitude))
}

function checkDraft() {
  if (!photoId.value)
    return
  const key = `${DRAFT_KEY_PREFIX}${photoId.value}`
  const saved = uni.getStorageSync(key)
  if (!saved)
    return

  try {
    const parsed = JSON.parse(saved)
    if (!isSubmitDraftMeaningful(parsed)) {
      uni.removeStorageSync(key)
      return
    }

    uni.showModal({
      title: '恢复草稿',
      content: '检测到您上次有未提交的作答草稿，是否恢复？',
      confirmText: '恢复',
      cancelText: '放弃',
      success: (res) => {
        if (res.confirm) {
          Object.assign(formData, parsed)
          uni.showToast({ title: '已恢复草稿', icon: 'success' })
        }
        else {
          uni.removeStorageSync(key)
        }
      },
    })
  }
  catch {
    uni.removeStorageSync(key)
  }
}

watch(
  formData,
  (newVal) => {
    if (!photoId.value)
      return
    const key = `${DRAFT_KEY_PREFIX}${photoId.value}`
    if (isSubmitDraftMeaningful(newVal)) {
      uni.setStorageSync(key, JSON.stringify(newVal))
    }
    else {
      uni.removeStorageSync(key)
    }
  },
  { deep: true },
)

function choosePhoto() {
  uni.chooseImage({
    count: 1,
    sourceType: ['camera', 'album'],
    success: async (res) => {
      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        const rawPath = res.tempFilePaths[0]
        const check = await validateImageAspectRatio(rawPath)
        if (!check.valid) {
          uni.showToast({ title: check.message || '图片比例过于悬殊', icon: 'none' })
          return
        }
        formData.filePath = await smartCompressImage(rawPath)
      }
    },
  })
}

/**
 * 这里是手写校验，不是没接 wd-form 的 rules——**这个版本的 wd-form 没有 rules 这个 prop**。
 * 它只认 `schema`（`{ validate(model) => Issue[] }`，配 zod/valibot 适配器用），
 * 传 `:rules` 会被当普通属性丢掉；`validate()` 里 `props.schema` 为空时
 * `rawIssues = []`，valid 恒为 true——空表单照样提交。
 * wd-form / wd-form-item 在这里只负责标签与排版。
 */
async function handleSubmit() {
  if (!requireLogin())
    return
  if (!formData.filePath) {
    uni.showToast({ title: '请先拍摄/选择实地拍照照片', icon: 'none' })
    return
  }
  if (!isSubmittableLocation(formData.latitude, formData.longitude)) {
    uni.showToast({ title: '请选择地点', icon: 'none' })
    return
  }

  loading.value = true
  try {
    await submitMutation.mutateAsync({
      photoId: photoId.value,
      filePath: formData.filePath,
      latitude: formData.latitude,
      longitude: formData.longitude,
      coordType: formData.coordType,
    })

    if (photoId.value) {
      uni.removeStorageSync(`${DRAFT_KEY_PREFIX}${photoId.value}`)
    }

    uni.redirectTo({
      url: withQuery(AppRoute.QuestionDetail, { id: photoId.value }),
      success: () => {
        uni.showModal({
          title: '作答已提交',
          content: '您的作答已成功提交，等待审核。',
          showCancel: false,
          confirmText: '我知道了',
          confirmColor: TX_BG_BROWN,
        })
      },
    })
  }
  catch {
    // Handled by interceptor
  }
  finally {
    loading.value = false
  }
}

const locationPickerRef = ref<{ locate: () => void, chooseLocation: () => void } | null>(null)
</script>

<template>
  <view class="page-submit-attempt safe-bottom-page bg-tx-main px-3 pt-3 space-y-4">
    <!-- 第一部分：图片 -->
    <view class="shadow-2xs border border-tx-border rounded-[18px] bg-white p-4 space-y-3">
      <view class="flex items-center gap-2 border-b border-tx-border/30 pb-2.5">
        <view class="h-4 w-1.5 rounded-full bg-tx-brown" />
        <text class="text-base text-tx-ink font-black tracking-tight">
          图片 <text class="text-rose-500">*</text>
        </text>
      </view>

      <view
        class="relative min-h-48 w-full flex flex-col cursor-pointer items-center justify-center overflow-hidden border-2 border-tx-border rounded-2xl border-dashed bg-tx-surface transition-colors active:bg-[#EFECE6]"
        @tap="choosePhoto"
      >
        <wd-img
          v-if="formData.filePath"
          custom-class="w-full block"
          :src="formData.filePath"
          lazy-load
          mode="widthFix"
          width="100%"
        />
        <view v-else class="flex flex-col items-center p-3 text-center space-y-1.5">
          <view class="shadow-2xs h-12 w-12 flex items-center justify-center rounded-full bg-tx-accent text-tx-ink">
            <text class="i-carbon:camera text-2xl font-black" />
          </view>
          <text class="block text-sm text-tx-ink font-black">拍照或选取现场照片</text>
          <text class="block text-xs text-tx-ink-2 font-bold">需包含关键特征点以供判定</text>
        </view>

        <view v-if="formData.filePath" class="shadow-xs absolute right-3.5 top-3.5 z-1 flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-white backdrop-blur-md">
          <text class="i-carbon:renew text-xs" />
          <text class="text-xs font-bold">重新选择</text>
        </view>
      </view>
    </view>

    <!-- 第二部分：定位 -->
    <view class="shadow-2xs border border-tx-border rounded-[18px] bg-white p-4 space-y-3">
      <view class="flex items-center justify-between border-b border-tx-border/30 pb-2.5">
        <view class="flex items-center gap-2">
          <view class="h-4 w-1.5 rounded-full bg-tx-brown" />
          <text class="text-base text-tx-ink font-black tracking-tight">
            定位 <text class="text-rose-500">*</text>
          </text>
        </view>
        <view class="flex items-center gap-3">
          <view
            class="flex cursor-pointer items-center gap-1 text-sm text-tx-brown font-bold transition-opacity active:opacity-70"
            @click="locationPickerRef?.locate()"
          >
            <text class="i-carbon:location text-sm text-tx-brown" />
            <text>定位</text>
          </view>
          <!-- #ifndef H5 -->
          <!-- H5 端无全屏选点：uni-h5 系统弹窗确认需先选 POI 列表项，高德安全密钥模式下列表加载失败；小程序端为微信原生弹窗，无此限制 -->
          <view
            class="flex cursor-pointer items-center gap-1 text-sm text-tx-ink-2 font-medium transition-opacity active:opacity-70"
            @click="locationPickerRef?.chooseLocation()"
          >
            <text class="i-carbon:map text-sm text-tx-ink-2" />
            <text>全屏</text>
          </view>
          <!-- #endif -->
        </view>
      </view>

      <!-- wd-form 只负责标签与排版；必填与坐标校验仍在 handleSubmit 显式判断（见 location-guard 测试） -->
      <wd-form :model="formData">
        <form-location-picker
          ref="locationPickerRef"
          v-model:latitude="formData.latitude"
          v-model:longitude="formData.longitude"
          v-model:address="formData.address"
          selected-text="已选择打卡定位"
        />
      </wd-form>
    </view>

    <!-- 第三部分：提交按钮 -->
    <view class="pt-2">
      <wd-button
        type="warning"
        round
        block
        size="large"
        custom-class="!font-bold !bg-tx-brown !text-white shadow-xs"
        :loading="loading"
        :disabled="loading"
        @click="handleSubmit"
      >
        提交作答
      </wd-button>
    </view>
  </view>
</template>
