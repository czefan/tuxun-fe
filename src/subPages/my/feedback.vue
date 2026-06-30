<template>
  <view class="page-feedback safe-bottom-page">
    <text class="page-feedback__title">反馈</text>
    <template v-if="userStore.isLoggedIn()">
      <text class="page-feedback__desc">提交你遇到的问题、玩法建议或异常信息。</text>
      <wd-textarea
        v-model="content"
        placeholder="请输入反馈内容"
        show-word-limit
        :maxlength="300"
        auto-height
      />
      <wd-button type="warning" round block custom-style="margin-top: 28rpx;" @click="submit">
        发送
      </wd-button>
    </template>
    <view v-else class="feedback-login-empty">
      <wd-empty icon="no-content" tip="未登录" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/store/user'

definePage({
  style: {
    navigationBarTitleText: '%page.feedback%',
  },
})

const userStore = useUserStore()
const content = ref('')

function submit() {
  uni.showToast({
    title: '已提交',
    icon: 'success',
  })
}
</script>

<style scoped lang="scss">
.page-feedback {
  padding: 42rpx 30rpx 0;
  background: #fffaf0;
}

.page-feedback__title,
.page-feedback__desc {
  display: block;
}

.page-feedback__title {
  font-size: 42rpx;
  font-weight: 900;
  color: #1f1b14;
}

.page-feedback__desc {
  margin: 14rpx 0 28rpx;
  font-size: 28rpx;
  color: #756c5e;
}

.feedback-login-empty {
  padding: 120rpx 0;
}

:deep(.wd-textarea) {
  background-color: #ffffff !important;
  border-radius: 14rpx !important;
  border-color: rgba(31, 27, 20, 0.06) !important;
  min-height: 260rpx;
  padding: 20rpx 22rpx !important;
}

:deep(.wd-textarea__inner) {
  min-height: 200rpx;
  max-height: 1000rpx;
  overflow-y: auto;
  font-size: 32rpx;
  line-height: 1.5;
  color: #1f1b14;
}

:deep(.wd-textarea__count) {
  background-color: #ffffff !important;
  color: #9a9286 !important;
  font-size: 24rpx !important;
  bottom: 12rpx !important;
  right: 14rpx !important;
}
</style>
