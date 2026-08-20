<script setup lang="ts">
definePage({
  style: {
    navigationBarTitleText: '%page.about%',
  },
})
</script>

<template>
  <view class="page-fill bottom-space bg-tx-main px-6 pt-8 space-y-8">
    <!-- 上半部分内容（品牌展示） -->
    <view class="text-center space-y-3">
      <view class="mx-auto h-20 w-20 flex items-center justify-center rounded-3xl bg-tx-brown text-white shadow-sm ring-4 ring-tx-accent/50">
        <text class="i-carbon:location text-4xl text-tx-accent font-extrabold" />
      </view>
      <view>
        <text class="block text-2xl text-tx-ink font-black tracking-tight">图寻 TuXun</text>
        <text class="mt-1 block text-xs text-tx-ink-2 font-mono">Version 1.0.0 (Build 2026.08)</text>
      </view>
      <view class="flex items-center justify-center gap-2 pt-1">
        <wd-tag type="warning" round size="small" custom-class="!font-bold !bg-tx-accent !text-tx-ink !border-tx-border">
          校园解密
        </wd-tag>
        <wd-tag type="warning" round size="small" custom-class="!font-bold !bg-tx-brown !text-white !border-tx-border">
          机位探索
        </wd-tag>
        <wd-tag type="warning" round size="small" custom-class="!font-bold !bg-tx-accent !text-tx-ink !border-tx-border">
          实景打卡
        </wd-tag>
      </view>
    </view>

    <!-- 校园解密与创建者中间的副文本区域（无卡片包裹） -->
    <view class="px-2 text-center space-y-3">
      <text class="block text-base text-[#5C4D3E] font-medium leading-relaxed">
        “图寻”是专门围绕校园地点解密与实景机位探索设计的高交互平台。通过探索同伴发布的实景地标、提交定位作答破解机位，参与校园探索活动并积累积分，兑换精美校园周边好礼！
      </text>
    </view>

    <!-- 底部创建者与版权纯文本（无卡片包裹） -->
    <view class="border-t border-tx-border/40 pt-6 text-center space-y-3">
      <view class="flex items-center justify-center gap-1.5 text-base text-tx-ink-2 font-medium">
        <text class="text-tx-ink font-bold">创建者：</text>
        <text class="text-[#5C4D3E] font-bold">挑战网</text>
      </view>
      <text class="block text-xs text-tx-ink-3 font-medium">
        © 2026 图寻 TuXun · 挑战网
      </text>
    </view>
  </view>
</template>
