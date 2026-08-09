<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useSubmitFeedback } from '@/features/feedback/query'
import { useAuth } from '@/features/user/composables/use-auth'
import { smartCompressImage } from '@/utils/image-compress'

definePage({
  style: {
    navigationBarTitleText: '%page.feedback%',
  },
})

const { isLoggedIn, loginDirectly, requireLogin } = useAuth()

const feedbackTypes = [
  { label: '内容问题', value: 1 },
  { label: '玩法建议', value: 2 },
  { label: '功能异常', value: 3 },
  { label: '其他问题', value: 4 },
]

const formData = reactive({
  type: 1 as 1 | 2 | 3 | 4,
  title: '',
  content: '',
  phone: '',
})

const mediaPath = ref<string>('')
const mediaType = ref<'image' | 'video' | ''>('')
const submitMutation = useSubmitFeedback()

function chooseMedia() {
  uni.chooseMedia({
    count: 1,
    mediaType: ['image', 'video'],
    success: async (res) => {
      const file = res.tempFiles[0]
      if (!file)
        return

      const type = res.type as 'image' | 'video'
      const sizeMB = file.size / (1024 * 1024)

      if (type === 'image') {
        if (sizeMB > 20) {
          uni.showToast({ title: '图片大小不能超过 20MB', icon: 'none' })
          return
        }
        const compressed = await smartCompressImage(file.tempFilePath)
        mediaPath.value = compressed
        mediaType.value = 'image'
      }
      else if (type === 'video') {
        if (sizeMB > 50) {
          uni.showToast({ title: '视频大小不能超过 50MB', icon: 'none' })
          return
        }
        mediaPath.value = file.tempFilePath
        mediaType.value = 'video'
      }
    },
  })
}

function removeMedia() {
  mediaPath.value = ''
  mediaType.value = ''
}

/** 静默无感获取用户系统、设备与环境诊断信息（选择「功能异常」提交时自动拼接到 content 末尾发给后端） */
function getEnvironmentDiagnosticString(): string {
  try {
    const info = uni.getSystemInfoSync()
    const parts: string[] = []

    const platform = info.uniPlatform || info.hostName || info.appName || ''
    if (platform) {
      parts.push(`平台: ${platform}`)
    }
    const os = `${info.osName || ''} ${info.osVersion || info.system || ''}`.trim()
    if (os) {
      parts.push(`系统: ${os}`)
    }
    const device = `${info.deviceBrand || info.brand || ''} ${info.deviceModel || info.model || ''}`.trim()
    if (device) {
      parts.push(`设备: ${device}`)
    }
    if (info.screenWidth && info.screenHeight) {
      parts.push(`分辨率: ${info.screenWidth}x${info.screenHeight} (DPR ${info.pixelRatio || 1})`)
    }
    if (info.language || info.osLanguage) {
      parts.push(`语言: ${info.language || info.osLanguage}`)
    }
    if (info.appVersion) {
      parts.push(`App版本: ${info.appVersion}`)
    }
    if (info.SDKVersion) {
      parts.push(`SDK版本: ${info.SDKVersion}`)
    }
    // #ifdef H5
    if (typeof navigator !== 'undefined' && navigator.userAgent) {
      parts.push(`UA: ${navigator.userAgent}`)
    }
    // #endif

    return parts.length ? `\n\n--- [环境信息 自动生成] ---\n${parts.join('\n')}` : ''
  }
  catch {
    return ''
  }
}

function handleSubmit() {
  if (!requireLogin()) {
    return
  }
  if (!formData.title.trim()) {
    uni.showToast({ title: '请输入反馈标题', icon: 'none' })
    return
  }
  if (!formData.content.trim()) {
    uni.showToast({ title: '请输入详细描述内容', icon: 'none' })
    return
  }

  let finalContent = formData.content.trim()
  // 选择「功能异常」(type === 3) 时静默拼接用户系统与设备诊断环境信息
  if (formData.type === 3) {
    finalContent += getEnvironmentDiagnosticString()
  }

  submitMutation.mutate(
    {
      type: formData.type,
      title: formData.title.trim(),
      content: finalContent,
      phone: formData.phone.trim() || undefined,
      mediaFile: mediaPath.value || undefined,
    },
    {
      onSuccess: () => {
        uni.showToast({ title: '反馈提交成功，感谢您的建议！', icon: 'success' })
        setTimeout(() => {
          uni.navigateBack()
        }, 1200)
      },
    },
  )
}
</script>

<template>
  <view class="safe-bottom-page box-border min-h-screen bg-[#F1DFC5] px-4 pt-4">
    <!-- 未登录页面级提示卡片（与通知界面保持100%样式一致） -->
    <view v-if="!isLoggedIn()" class="min-h-[calc(100vh-120rpx)] flex flex-col items-center justify-center pb-12 -mt-12">
      <wd-empty icon="no-result" tip="登录后提交意见反馈" />
      <wd-button size="small" round type="warning" custom-class="!mt-4 !font-bold shadow-md" @click="loginDirectly">
        去登录
      </wd-button>
    </view>

    <!-- 已登录：4 卡片分块反馈表单 (与投稿界面 100% 保持一致设计) -->
    <view v-else class="space-y-4">
      <!-- 第一部分：选择反馈类型 (Feedback Type Section) -->
      <view class="shadow-2xs border border-[#D3BA9F] rounded-[18px] bg-white p-4 space-y-3">
        <view class="flex items-center gap-2 border-b border-[#D3BA9F]/30 pb-2.5">
          <view class="h-4 w-1.5 rounded-full bg-[#B69171]" />
          <text class="text-base text-[#1E1E1E] font-black tracking-tight">
            反馈类型 <text class="text-rose-500">*</text>
          </text>
        </view>

        <view class="grid grid-cols-2 gap-2.5">
          <view
            v-for="item in feedbackTypes"
            :key="item.value"
            class="flex cursor-pointer items-center justify-center border rounded-xl py-2.5 text-xs font-bold transition-all active:scale-95"
            :class="[
              formData.type === item.value
                ? 'border-[#D3BA9F] bg-[#F9DF95] text-[#1E1E1E] shadow-2xs'
                : 'border-[#D3BA9F]/40 bg-[#B69171]/5 text-[#756C5E]',
            ]"
            @click="formData.type = item.value as any"
          >
            {{ item.label }}
          </view>
        </view>
      </view>

      <!-- 第二部分：文字信息 (Text Section) -->
      <view class="shadow-2xs border border-[#D3BA9F] rounded-[18px] bg-white p-4 space-y-3.5">
        <view class="flex items-center gap-2 border-b border-[#D3BA9F]/30 pb-2.5">
          <view class="h-4 w-1.5 rounded-full bg-[#B69171]" />
          <text class="text-base text-[#1E1E1E] font-black tracking-tight">文字信息</text>
        </view>

        <wd-form :model="formData" custom-class="block space-y-3.5">
          <!-- 1. 反馈标题 -->
          <view class="space-y-1.5">
            <text class="block text-xs text-[#756C5E] font-bold">
              反馈标题 <text class="text-rose-500">*</text>
            </text>
            <wd-input
              v-model="formData.title"
              placeholder="输入反馈标题 (最多 30 字)"
              :maxlength="30"
              clearable
              custom-class="!bg-[#F8F6F2] !rounded-xl !p-3 !border !border-[#D3BA9F]/60"
            />
          </view>

          <!-- 2. 反馈详细内容 -->
          <view class="space-y-1.5">
            <text class="block text-xs text-[#756C5E] font-bold">
              详细描述 <text class="text-rose-500">*</text>
            </text>
            <wd-textarea
              v-model="formData.content"
              placeholder="请详细描述遇到的问题或建议 (最多 500 字)..."
              :maxlength="500"
              clearable
              custom-class="!bg-[#F8F6F2] !rounded-xl !p-3 !border !border-[#D3BA9F]/60"
            />
          </view>

          <!-- 3. 联系电话 / 微信 -->
          <view class="space-y-1.5">
            <text class="block text-xs text-[#756C5E] font-bold">
              联系方式 <text class="text-xs text-[#8A7E70] font-normal">(选填)</text>
            </text>
            <wd-input
              v-model="formData.phone"
              placeholder="电话/微信，方便跟进排查并联系您"
              :maxlength="30"
              clearable
              custom-class="!bg-[#F8F6F2] !rounded-xl !p-3 !border !border-[#D3BA9F]/60"
            />
          </view>
        </wd-form>
      </view>

      <!-- 第三部分：图片 / 视频 (Photo Section) -->
      <view class="shadow-2xs border border-[#D3BA9F] rounded-[18px] bg-white p-4 space-y-3">
        <view class="flex items-center justify-between border-b border-[#D3BA9F]/30 pb-2.5">
          <view class="flex items-center gap-2">
            <view class="h-4 w-1.5 rounded-full bg-[#B69171]" />
            <text class="text-base text-[#1E1E1E] font-black tracking-tight">
              附件（图片/视频） <text class="text-xs text-[#8A7E70] font-normal">(选填，最多 1 个)</text>
            </text>
          </view>
        </view>

        <view class="flex flex-wrap gap-3">
          <view v-if="mediaPath" class="relative h-28 w-28">
            <wd-img
              v-if="mediaType === 'image'"
              custom-class="h-full w-full rounded-2xl bg-amber-50 object-cover ring-1 ring-[#D3BA9F] shadow-xs"
              :src="mediaPath"
              lazy-load
              mode="aspectFill"
              width="224rpx"
              height="224rpx"
            />
            <video
              v-else-if="mediaType === 'video'"
              class="shadow-xs h-full w-full rounded-2xl bg-black"
              :src="mediaPath"
              :controls="false"
            />
            <view
              class="absolute h-6 w-6 flex cursor-pointer items-center justify-center rounded-full bg-red-500 text-white shadow-md -right-2 -top-2 active:scale-90"
              @tap="removeMedia"
            >
              <wd-icon name="close" size="14px" />
            </view>
          </view>
          <view
            v-else
            class="h-28 w-28 flex flex-col cursor-pointer items-center justify-center border-2 border-[#D3BA9F] rounded-2xl border-dashed bg-[#F8F6F2] text-[#756C5E] transition-all active:scale-95"
            @tap="chooseMedia"
          >
            <text class="i-carbon:camera mb-1 text-2xl text-[#B69171]" />
            <text class="text-xs text-[#1E1E1E] font-bold">上传图片/视频</text>
          </view>
        </view>
      </view>

      <!-- 第四部分：提交反馈按钮 (Submit Section) -->
      <view class="pt-2">
        <wd-button
          type="warning"
          round
          block
          size="large"
          custom-class="!font-black !bg-[#B69171] !text-white !border-0 shadow-md active:scale-[0.99] transition-transform"
          :disabled="submitMutation.isPending.value"
          :loading="submitMutation.isPending.value"
          @click="handleSubmit"
        >
          提交反馈
        </wd-button>
      </view>
    </view>
  </view>
</template>
