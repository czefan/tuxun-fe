<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '@/features/user/composables/use-auth'
import MyAnswerTab from '@/features/record/components/my-answer-tab.vue'
import StatusTabSwiper from '@/features/record/components/status-tab-swiper.vue'

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
const statusMap: Record<StatusOption, undefined | 'pending' | 'solved' | 'unsolved'> = {
  全部: undefined,
  审核中: 'pending',
  已破解: 'solved',
  未破解: 'unsolved',
}
</script>

<template>
  <view class="page-my-answers swiper-page bg-tx-main px-3 pt-3">
    <StatusTabSwiper v-model="activeStatusIndex" :options="statusOptions">
      <template #panel="{ option, active }">
        <MyAnswerTab
          :status="statusMap[option as StatusOption]"
          :active="active"
          @login="loginDirectly"
        />
      </template>
    </StatusTabSwiper>
  </view>
</template>
