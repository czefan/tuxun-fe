<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '%page.help%',
  },
})
</script>

<template>
  <view class="page-profile-text safe-bottom-page">
    <text class="page-profile-text__title">帮助中心</text>
    <text class="u-paragraph">1. 浏览题目后，前往现场寻找相同机位。</text>
    <text class="u-paragraph">2. 答题需实时拍摄照片，并结合 GPS 定位校验。</text>
    <text class="u-paragraph">3. 请勿在评论区泄露具体地点或答案。</text>
    <text class="u-paragraph">4. 出题、答题和参与活动可获得积分。</text>
  </view>
</template>

<style scoped lang="scss">
.page-profile-text {
  padding: 42rpx 30rpx 0;
  background: #fffaf0;
}

.page-profile-text__title {
  display: block;
  margin-bottom: 28rpx;
  font-size: 42rpx;
  font-weight: 900;
  color: #1f1b14;
}
</style>
