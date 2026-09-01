<script setup lang="ts">
import { ref } from 'vue'
import type { UserPhotoVM } from '@/features/record/types'
import { useAuth } from '@/features/user/composables/use-auth'
import { AppRoute, withQuery } from '@/router/routes'
import MyContributionTab from '@/features/record/components/my-contribution-tab.vue'
import StatusTabSwiper from '@/features/record/components/status-tab-swiper.vue'
import ContributionDetailModal from '@/features/record/components/contribution-detail-modal.vue'

definePage({
  style: {
    navigationBarTitleText: '%page.contributions%',
    enablePullDownRefresh: true,
  },
})

const { loginDirectly } = useAuth()

const statusOptions = ['全部', '审核中', '已通过', '未通过'] as const
type StatusOption = (typeof statusOptions)[number]
const activeStatusIndex = ref<StatusOption>('全部')
const statusMap: Record<StatusOption, undefined | 'pending' | 'approved' | 'rejected'> = {
  全部: undefined,
  审核中: 'pending',
  已通过: 'approved',
  未通过: 'rejected',
}

const selectedId = ref<number | null>(null)

function openDetail(item: UserPhotoVM) {
  const statusStr = String(item.status || '').toLowerCase()
  if (statusStr === 'approved' || statusStr === 'published') {
    uni.navigateTo({ url: withQuery(AppRoute.QuestionDetail, { id: item.id }) })
    return
  }
  selectedId.value = item.id
}
</script>

<template>
  <view class="page-my-contributions swiper-page bg-tx-main px-3 pt-3">
    <StatusTabSwiper v-model="activeStatusIndex" :options="statusOptions">
      <template #panel="{ option, active }">
        <MyContributionTab
          :status="statusMap[option as StatusOption]"
          :active="active"
          @open-detail="openDetail"
          @login="loginDirectly"
        />
      </template>
    </StatusTabSwiper>

    <ContributionDetailModal v-model:id="selectedId" />
  </view>
</template>
