<template>
  <view class="page-feedback safe-bottom-page">
    <text class="page-feedback__title">意见反馈</text>
    <template v-if="userStore.isLoggedIn()">
      <!-- 反览类型 -->
      <view class="feedback-card">
        <view class="feedback-card__title">
          选择类型
        </view>
        <view class="type-grid">
          <view
            v-for="item in typeOptions"
            :key="item.value"
            class="type-item"
            :class="{ 'type-item--active': selectedType === item.value }"
            @tap="selectedType = item.value"
          >
            {{ item.label }}
          </view>
        </view>
      </view>

      <!-- 设备环境 -->
      <view v-if="selectedType === 'bug'" class="feedback-card feedback-env-card">
        <view class="feedback-card__title">
          设备环境 (可编辑)
        </view>
        <textarea
          v-model="deviceEnvText"
          class="feedback-env-textarea"
          placeholder="请描述您的手机型号、系统版本等设备环境..."
          auto-height
        />
        <view class="feedback-env-tip">
          自动识别可能存在偏差，如不准确可手动修改。
        </view>
      </view>

      <!-- 反馈内容 -->
      <view class="feedback-card">
        <view class="feedback-card__title">
          反馈内容
        </view>
        <wd-textarea
          v-model="content"
          :placeholder="contentPlaceholder"
          placeholder-class="feedback-textarea-placeholder"
          show-word-limit
          :maxlength="500"
          auto-height
        />
      </view>

      <!-- 媒体上传 -->
      <view class="feedback-card">
        <view class="feedback-card__title">
          图片与视频 (最多3个)
        </view>
        <view class="media-grid">
          <view
            v-for="(item, index) in mediaList"
            :key="index"
            class="media-item"
            @tap="previewMedia(item)"
          >
            <image v-if="item.type === 'image'" class="media-img" :src="item.url" mode="aspectFill" />
            <view v-else class="media-video-placeholder">
              <wd-icon name="play-circle" color="#ffffff" size="48rpx" />
              <text class="video-tip">视频</text>
            </view>
            <view v-if="item.uploading" class="media-status-overlay">
              <wd-loading type="circular" color="#ffffff" size="36rpx" />
              <text class="media-status-text">上传中</text>
            </view>
            <view class="media-delete-btn" @tap.stop="removeMedia(index)">
              <wd-icon name="close" color="#ffffff" size="18rpx" />
            </view>
          </view>
          <view v-if="mediaList.length < 3" class="media-add-btn" @tap="chooseAndUploadMedia">
            <view class="media-add-inner">
              <wd-icon name="camera" color="#a09688" size="48rpx" />
              <text class="media-add-text">添加图片/视频</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 联系方式 -->
      <view class="feedback-card">
        <view class="feedback-card__title">
          联系方式 (选填)
        </view>
        <input
          v-model="contact"
          class="feedback-input"
          placeholder="手机号、微信号或邮箱，方便与您沟通"
          placeholder-class="feedback-input-placeholder"
        >
      </view>

      <wd-button type="warning" round block custom-style="margin-top: 36rpx; height: 88rpx;" :disabled="isSubmitting" @click="submit">
        {{ isSubmitting ? '提交中...' : '提交反馈' }}
      </wd-button>
    </template>
    <view v-else class="feedback-login-empty">
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
.page-feedback {
  padding: 30rpx 30rpx calc(40rpx + env(safe-area-inset-bottom));
  background: #fffaf0;
  min-height: 100vh;
  box-sizing: border-box;
}

.page-feedback__title {
  display: block;
  font-size: 42rpx;
  font-weight: 900;
  color: #1f1b14;
  margin-bottom: 24rpx;
}

.feedback-card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  border: 1rpx solid rgba(31, 27, 20, 0.04);
}

.feedback-card__title {
  font-size: 28rpx;
  font-weight: 700;
  color: #1f1b14;
  margin-bottom: 18rpx;
}

.type-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.type-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80rpx;
  background: #fdfcf9;
  border: 2rpx solid rgba(31, 27, 20, 0.05);
  border-radius: 12rpx;
  font-size: 26rpx;
  color: #756c5e;
  transition: all 0.2s ease;
}

.type-item--active {
  background: #fef9eb;
  border-color: #f5c542;
  color: #b28000;
  font-weight: 700;
}

.feedback-env-card {
  background-color: #fbfaf8;
}

.feedback-env-textarea {
  width: 100%;
  min-height: 120rpx;
  max-height: 400rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: #7c7468;
  white-space: pre-wrap;
  background: #ffffff;
  padding: 16rpx 20rpx;
  border-radius: 8rpx;
  border: 1rpx solid rgba(31, 27, 20, 0.08);
  box-sizing: border-box;
}

.feedback-env-tip {
  margin-top: 12rpx;
  font-size: 22rpx;
  color: #a39c91;
  line-height: 1.4;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18rpx;
}

.media-item,
.media-add-btn {
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  height: 0;
  border-radius: 12rpx;
  overflow: hidden;
  box-sizing: border-box;
}

.media-item {
  background-color: #f7f4ee;
  border: 1rpx solid rgba(31, 27, 20, 0.08);
}

.media-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.media-video-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #2b2b2b;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
}

.video-tip {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.7);
}

.media-status-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  z-index: 2;
}

.media-status-text {
  font-size: 20rpx;
  color: #ffffff;
}

.media-delete-btn {
  position: absolute;
  top: 6rpx;
  right: 6rpx;
  width: 34rpx;
  height: 34rpx;
  background: rgba(0, 0, 0, 0.65);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
}

.media-add-btn {
  background-color: #fdfcf9;
  border: 2rpx dashed rgba(31, 27, 20, 0.15);
}

.media-add-btn .media-add-inner {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
}

.media-add-text {
  font-size: 20rpx;
  color: #8b8273;
}

.feedback-input {
  height: 80rpx;
  background: #ffffff;
  border: 1rpx solid rgba(31, 27, 20, 0.08);
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #1f1b14;
}

.feedback-input-placeholder {
  color: #a39c91;
  font-size: 28rpx;
}

:deep(.feedback-textarea-placeholder),
.feedback-textarea-placeholder {
  font-size: 28rpx;
  line-height: 1.6 !important;
  color: #a39c91;
}

.feedback-login-empty {
  padding: 120rpx 0;
}

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
