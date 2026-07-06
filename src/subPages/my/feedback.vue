<template>
  <view class="page-feedback safe-bottom-page box-border min-h-100vh bg-[#fffaf0] p-[30rpx_30rpx_calc(40rpx+env(safe-area-inset-bottom))]">
    <text class="mb-24rpx block text-42rpx text-[#1f1b14] font-900">意见反馈</text>
    <template v-if="userStore.isLoggedIn()">
      <!-- 反馈类型 -->
      <view class="mb-24rpx border border-[rgba(31,27,20,0.04)] rounded-16rpx border-solid bg-white p-28rpx">
        <view class="mb-18rpx text-28rpx text-[#1f1b14] font-700">
          选择类型
        </view>
        <view class="grid grid-cols-2 gap-16rpx">
          <view
            v-for="item in typeOptions"
            :key="item.value"
            class="h-80rpx flex cursor-pointer items-center justify-center border-2rpx border-[rgba(31,27,20,0.05)] rounded-12rpx border-solid bg-[#fdfcf9] text-26rpx text-[#756c5e] transition-all duration-200 ease-in-out"
            :class="[selectedType === item.value ? 'bg-[#fef9eb] border-[#f5c542] text-[#b28000] font-700' : '']"
            @tap="selectedType = item.value"
          >
            {{ item.label }}
          </view>
        </view>
      </view>

      <!-- 设备环境 -->
      <view v-if="selectedType === 'bug'" class="mb-24rpx border border-[rgba(31,27,20,0.04)] rounded-16rpx border-solid bg-[#fbfaf8] p-28rpx">
        <view class="mb-18rpx text-28rpx text-[#1f1b14] font-700">
          设备环境 (可编辑)
        </view>
        <textarea
          v-model="deviceEnvText"
          class="box-border max-h-400rpx min-h-120rpx w-full whitespace-pre-wrap border border-[rgba(31,27,20,0.08)] rounded-8rpx border-solid bg-white p-[16rpx_20rpx] text-24rpx text-[#7c7468] leading-[1.6em]"
          placeholder="请描述您的手机型号、系统版本等设备环境..."
          auto-height
        />
        <view class="mt-12rpx text-22rpx text-[#a39c91] leading-1.4">
          自动识别可能存在偏差，如不准确可手动修改。
        </view>
      </view>

      <!-- 反馈内容 -->
      <view class="mb-24rpx border border-[rgba(31,27,20,0.04)] rounded-16rpx border-solid bg-white p-28rpx">
        <view class="mb-18rpx text-28rpx text-[#1f1b14] font-700">
          反馈内容
        </view>
        <wd-textarea
          v-model="content"
          :placeholder="contentPlaceholder"
          custom-class="tx-textarea"
          placeholder-class="feedback-textarea-placeholder"
          show-word-limit
          :maxlength="500"
          auto-height
        />
      </view>

      <!-- 媒体上传 -->
      <view class="mb-24rpx border border-[rgba(31,27,20,0.04)] rounded-16rpx border-solid bg-white p-28rpx">
        <view class="mb-18rpx text-28rpx text-[#1f1b14] font-700">
          图片与视频 (最多3个)
        </view>
        <view class="grid grid-cols-3 gap-18rpx">
          <view
            v-for="(item, index) in mediaList"
            :key="index"
            class="relative box-border h-0 w-full cursor-pointer overflow-hidden border border-[rgba(31,27,20,0.08)] rounded-12rpx border-solid bg-[#f7f4ee] pb-[100%]"
            @tap="previewMedia(item)"
          >
            <image v-if="item.type === 'image'" class="absolute inset-0 h-full w-full" :src="item.url" mode="aspectFill" />
            <view v-else class="absolute inset-0 h-full w-full flex flex-col items-center justify-center gap-6rpx bg-[#2b2b2b]">
              <wd-icon name="play-circle" color="#ffffff" size="48rpx" />
              <text class="text-20rpx text-white/70">视频</text>
            </view>
            <view v-if="item.uploading" class="absolute inset-0 z-2 h-full w-full flex flex-col items-center justify-center gap-6rpx bg-black/55">
              <wd-loading type="circular" color="#ffffff" size="36rpx" />
              <text class="text-20rpx text-white">上传中</text>
            </view>
            <view class="absolute right-6rpx top-6rpx z-3 h-34rpx w-34rpx flex items-center justify-center rounded-full bg-black/65" @tap.stop="removeMedia(index)">
              <wd-icon name="close" color="#ffffff" size="18rpx" />
            </view>
          </view>
          <view v-if="mediaList.length < 3" class="relative box-border h-0 w-full cursor-pointer overflow-hidden border-2rpx border-[rgba(31,27,20,0.15)] rounded-12rpx border-dashed bg-[#fdfcf9] pb-[100%]" @tap="chooseAndUploadMedia">
            <view class="absolute inset-0 h-full w-full flex flex-col items-center justify-center gap-6rpx">
              <wd-icon name="camera" color="#a09688" size="48rpx" />
              <text class="text-20rpx text-[#8b8273]">添加图片/视频</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 联系方式 -->
      <view class="mb-24rpx border border-[rgba(31,27,20,0.04)] rounded-16rpx border-solid bg-white p-28rpx">
        <view class="mb-18rpx text-28rpx text-[#1f1b14] font-700">
          联系方式 (选填)
        </view>
        <input
          v-model="contact"
          class="box-border h-80rpx w-full border border-[rgba(31,27,20,0.08)] rounded-12rpx border-solid bg-white px-24rpx text-28rpx text-[#1f1b14]"
          placeholder="手机号、微信号或邮箱，方便与您沟通"
          placeholder-class="feedback-input-placeholder"
        >
      </view>

      <wd-button type="warning" round block custom-style="margin-top: 36rpx; height: 88rpx;" :disabled="isSubmitting" @click="submit">
        {{ isSubmitting ? '提交中...' : '提交反馈' }}
      </wd-button>
    </template>
    <view v-else class="py-120rpx">
      <wd-empty icon="no-content" tip="未登录" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useUserStore } from '@/store/user'
import { submitFeedback, uploadFeedbackImage } from '@/service/api/user'
import type { FeedbackType } from '@/service/api/user'

definePage({
  style: {
    navigationBarTitleText: '%page.feedback%',
  },
})

interface MediaItem {
  url: string
  type: 'image' | 'video'
  uploading: boolean
  remoteUrl: string
}

// 静态常量提升，避免实例重复声明
const TYPE_OPTIONS = [
  { label: '内容问题', value: 'content' as FeedbackType },
  { label: '玩法建议', value: 'suggestion' as FeedbackType },
  { label: '技术报错', value: 'bug' as FeedbackType },
  { label: '其他', value: 'other' as FeedbackType },
] as const

const PLACEHOLDER_MAP: Record<FeedbackType, string> = {
  bug: '请详细描述您遇到的技术报错、异常现象或重现步骤，以便我们定位解决...',
  suggestion: '分享您对游戏玩法的绝妙建议，让我们一起把游戏做得更好...',
  content: '请指出具体的内容错误，如题目、地名、地图标注等，并说明正确的内容...',
  other: '请输入您想反馈的其他内容或意见...',
}

const userStore = useUserStore()
const content = ref('')
const contact = ref('')
const selectedType = ref<FeedbackType>('content')
const isSubmitting = ref(false)
const mediaList = ref<MediaItem[]>([])
const deviceEnvText = ref(getDeviceEnvInfo())

const typeOptions = TYPE_OPTIONS

const contentPlaceholder = computed(() => {
  return PLACEHOLDER_MAP[selectedType.value] || '请输入反馈内容...'
})

// 并行上传媒体文件
function chooseAndUploadMedia() {
  uni.chooseMedia({
    count: 3 - mediaList.value.length,
    mediaType: ['image', 'video'],
    success: (res) => {
      const uploadTasks = res.tempFiles.map(async (file) => {
        const isImage = file.fileType === 'image'
        const limit = isImage ? 10 * 1024 * 1024 : 50 * 1024 * 1024
        if (file.size > limit) {
          uni.showToast({
            title: `${isImage ? '图片' : '视频'}大小不能超过 ${isImage ? '10MB' : '50MB'}`,
            icon: 'none',
          })
          return
        }

        const item = reactive<MediaItem>({
          url: file.tempFilePath,
          type: file.fileType as 'image' | 'video',
          uploading: true,
          remoteUrl: '',
        })
        mediaList.value.push(item)

        try {
          const uploadRes = await uploadFeedbackImage(file.tempFilePath)
          item.remoteUrl = uploadRes.url
          item.uploading = false
        }
        catch (e) {
          uni.showToast({ title: '上传失败', icon: 'none' })
          mediaList.value = mediaList.value.filter(m => m !== item)
        }
      })
      Promise.all(uploadTasks)
    },
  })
}

// 预览媒体
function previewMedia(item: MediaItem) {
  if (item.uploading)
    return
  if (item.type === 'image') {
    uni.previewImage({
      urls: mediaList.value.filter(m => m.type === 'image').map(m => m.remoteUrl || m.url),
      current: item.remoteUrl || item.url,
    })
  }
  else if (uni.previewMedia) {
    uni.previewMedia({
      sources: [{ url: item.remoteUrl || item.url, type: 'video' }],
    })
  }
}

// 删除媒体
function removeMedia(index: number) {
  mediaList.value.splice(index, 1)
}

// 获取设备环境信息
function getDeviceEnvInfo(): string {
  try {
    const systemInfo = uni.getSystemInfoSync()
    return `手机品牌: ${systemInfo.brand || '未知'}
手机型号: ${systemInfo.model || '未知'}
系统版本: ${systemInfo.system || '未知'}
客户端版本: ${systemInfo.version || '未知'}
运行平台: ${systemInfo.platform || '未知'}`
  }
  catch (e) {
    return '手机品牌: 未知\n手机型号: 未知\n系统版本: 未知\n客户端版本: 未知\n运行平台: 未知'
  }
}

// 提交反馈
async function submit() {
  if (!content.value.trim()) {
    uni.showToast({ title: '请输入反馈内容', icon: 'none' })
    return
  }
  if (mediaList.value.some(m => m.uploading)) {
    uni.showToast({ title: '媒体文件上传中，请稍后', icon: 'none' })
    return
  }

  isSubmitting.value = true
  uni.showLoading({ title: '正在提交' })

  let finalContent = content.value.trim()
  if (selectedType.value === 'bug') {
    finalContent += `\n\n--- 设备环境 ---\n${deviceEnvText.value}`
  }

  try {
    await submitFeedback({
      content: finalContent,
      type: selectedType.value,
      contact: contact.value.trim(),
      imageUrls: mediaList.value.map(m => m.remoteUrl).filter(Boolean),
    })
    uni.showToast({ title: '感谢您的反馈', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }
  catch (e) {
    uni.showToast({ title: '提交失败，请重试', icon: 'none' })
  }
  finally {
    uni.hideLoading()
    isSubmitting.value = false
  }
}
</script>

<style scoped lang="scss">
:deep(.wd-textarea) {
  background-color: #ffffff !important;
  border-radius: 14rpx !important;
  border: 1rpx solid rgba(31, 27, 20, 0.08) !important;
  min-height: 200rpx;
  padding: 16rpx 18rpx !important;
}

:deep(.wd-textarea__inner) {
  min-height: 160rpx;
  max-height: 800rpx;
  overflow-y: auto;
  font-size: 28rpx;
  line-height: 1.5;
  color: #1f1b14;
}

:deep(.wd-textarea__count) {
  background-color: #ffffff !important;
  color: #9a9286 !important;
  font-size: 22rpx !important;
  bottom: 8rpx !important;
  right: 10rpx !important;
}
</style>
