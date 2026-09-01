<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuth } from '@/features/user/composables/use-auth'
import TabHeader from '@/components/tab-header/tab-header.vue'
import MyAnswerTab from '@/features/record/components/my-answer-tab.vue'

definePage({
  style: {
    navigationBarTitleText: '%page.answers%',
    enablePullDownRefresh: true,
  },
})

const { loginDirectly } = useAuth()
const statusOptions = ['全部', '审核中', '已破解', '未破解'] as const
type StatusOption = (typeof statusOptions)[number]
const activeStatusIndex = ref<StatusOption>('全部')
const currentTabIndex = computed(() => statusOptions.indexOf(activeStatusIndex.value))
const statusMap: Record<StatusOption, undefined | 'pending' | 'solved' | 'unsolved'> = {
  全部: undefined,
  审核中: 'pending',
  已破解: 'solved',
  未破解: 'unsolved',
}
</script>

<template>
  <view class="page-my-answers swiper-page bg-tx-main px-3 pt-3">
    <!-- 顶栏 Tab 切换器 -->
    <TabHeader v-model="activeStatusIndex" :options="statusOptions" />

    <!-- 支持左右滑动的 Swiper 容器 -->
    <swiper
      class="box-border min-h-0 w-[calc(100%+24px)] flex-1 -mx-3"
      :current="currentTabIndex"
      :duration="300"
      @change="(e) => (activeStatusIndex = statusOptions[e.detail.current])"
    >
      <swiper-item v-for="opt in statusOptions" :key="opt" class="box-border">
        <MyAnswerTab
          :status="statusMap[opt]"
          :active="activeStatusIndex === opt"
          @login="loginDirectly"
        />
      </swiper-item>
    </swiper>
  </view>
</template>
