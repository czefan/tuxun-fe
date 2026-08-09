<script setup lang="ts">
import { ref } from 'vue'
import { useContent } from '@/features/content/query'

definePage({
  style: {
    navigationBarTitleText: '%page.help%',
  },
})

const { data } = useContent('help')

const faqList = ref([
  { title: '如何参与校园解密答题？', content: '进入首页或活动列表，挑选感兴趣的地标题目，点击“我要答题”上传您拍摄的同款机位照片和定位坐标即可提交作答！' },
  { title: '如何获取和使用积分？', content: '发布合规题目、成功破解他人题目均可获得相应积分奖励，获得的积分可在“积分商城”兑换精美的校园专属好礼。' },
  { title: '题目答案坐标何时公开？', content: '为保证解密活动的公平性，进行中的题目答案坐标保持隐藏；待该活动正式结束后，真实坐标与地图定位将自动对全站公开。' },
  { title: '单题作答次数是否有限制？', content: '每位用户对同一道题目最多拥有 5 次提交作答的机会，请珍惜每次提交机会并确保提交的定位与机位准确无误。' },
])
</script>

<template>
  <view class="page-help safe-bottom-page bg-[#F1DFC5] px-4 pt-4 space-y-5">
    <!-- 常见问题 FAQ (无 UI 图标，全靠主副文本排版) -->
    <view class="space-y-3">
      <text class="block text-base text-[#1E1E1E] font-extrabold tracking-tight">常见问题 FAQ</text>

      <view class="border-y border-[#B69171]">
        <view
          v-for="(faq, idx) in faqList"
          :key="idx"
          class="py-3.5 space-y-1"
          :class="idx > 0 ? 'border-t border-[#B69171]/40' : ''"
        >
          <!-- 问题标题 (主文本) -->
          <text class="block text-base text-[#1E1E1E] font-bold">{{ faq.title }}</text>
          <!-- 详细解释 (副文本) -->
          <text class="block text-sm text-[#554738] font-normal leading-relaxed">{{ faq.content }}</text>
        </view>
      </view>
    </view>

    <!-- 动态帮助文档 (无 UI 图标，纯副文本) -->
    <view v-if="data?.content" class="pt-2 space-y-2">
      <text class="block text-base text-[#1E1E1E] font-extrabold tracking-tight">官方规则说明</text>
      <view class="border-y border-[#B69171] py-3.5">
        <rich-text :nodes="data.content" class="text-sm text-[#554738] font-normal leading-relaxed" />
      </view>
    </view>
  </view>
</template>
