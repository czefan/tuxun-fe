<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '%page.about%',
  },
})
</script>

<template>
  <view class="page-profile-text safe-bottom-page">
    <text class="page-profile-text__title">关于我们</text>
    <text class="u-paragraph">图寻是围绕校园地点解密和机位破解设计的小程序活动。</text>
    <text class="u-paragraph">用户可以通过浏览题目、现场答题、发布题目和参与活动获得积分。</text>
    <wd-button type="warning" round block custom-style="margin-top: 24rpx;">
      查看官网链接
    </wd-button>
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
