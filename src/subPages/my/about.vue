<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '%page.about%',
  },
})
</script>

<template>
  <view class="page-fill bottom-space bg-[#F1DFC5] px-6 pt-8 space-y-8">
    <!-- 上半部分内容（品牌展示） -->
    <view class="text-center space-y-3">
      <view class="mx-auto h-20 w-20 flex items-center justify-center rounded-3xl bg-[#B69171] text-white shadow-sm ring-4 ring-[#F9DF95]/50">
        <text class="i-carbon:location text-4xl text-[#F9DF95] font-extrabold" />
      </view>
      <view>
        <text class="block text-2xl text-[#1E1E1E] font-black tracking-tight">图寻 TuXun</text>
        <text class="mt-1 block text-xs text-[#756C5E] font-mono">Version 1.0.0 (Build 2026.08)</text>
      </view>
      <view class="flex items-center justify-center gap-2 pt-1">
        <wd-tag type="warning" round size="small" custom-class="!font-bold !bg-[#F9DF95] !text-[#1E1E1E] !border-[#D3BA9F]">
          校园解密
        </wd-tag>
        <wd-tag type="warning" round size="small" custom-class="!font-bold !bg-[#B69171] !text-white !border-[#D3BA9F]">
          机位探索
        </wd-tag>
        <wd-tag type="warning" round size="small" custom-class="!font-bold !bg-[#F9DF95] !text-[#1E1E1E] !border-[#D3BA9F]">
          实景打卡
        </wd-tag>
      </view>
    </view>

    <!-- 校园解密与创建者中间的副文本区域（无卡片包裹） -->
    <view class="px-2 text-center space-y-3">
      <text class="block text-sm text-[#5C4D3E] font-medium leading-relaxed">
        “图寻”是专门围绕校园地点解密与实景机位探索设计的高交互平台。通过探索同伴发布的实景地标、提交定位作答破解机位，参与校园探索活动并积累积分，兑换精美校园周边好礼！
      </text>
    </view>

    <!-- 底部创建者与版权纯文本（无卡片包裹） -->
    <view class="border-t border-[#D3BA9F]/40 pt-6 text-center space-y-3">
      <view class="flex items-center justify-center gap-1.5 text-sm text-[#756C5E] font-medium">
        <text class="text-[#1E1E1E] font-bold">创建者：</text>
        <text class="text-[#5C4D3E] font-bold">挑战网</text>
      </view>
      <text class="block text-xs text-[#8A7E70] font-medium">
        © 2026 图寻 TuXun · 挑战网
      </text>
    </view>
  </view>
</template>
