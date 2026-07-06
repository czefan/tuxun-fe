<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '%page.about%',
  },
})
</script>

<template>
  <view class="page-profile-text safe-bottom-page bg-[#fffaf0] px-30rpx pt-42rpx">
    <text class="mb-28rpx block text-42rpx text-[#1f1b14] font-900">关于我们</text>
    <text class="u-paragraph">图寻是围绕校园地点解密和机位破解设计的小程序活动。</text>
    <text class="u-paragraph">用户可以通过浏览题目、现场答题、发布题目和参与活动获得积分。</text>
    <wd-button type="warning" round block custom-style="margin-top: 24rpx;">
      查看官网链接
    </wd-button>
  </view>
</template>
