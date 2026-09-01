<script setup lang="ts">
import { computed, ref } from 'vue'
import type { UserPhotoVM } from '@/features/record/types'
import { useAuth } from '@/features/user/composables/use-auth'
import { AppRoute, withQuery } from '@/router/routes'
import TabHeader from '@/components/tab-header/tab-header.vue'
import MyContributionTab from '@/features/record/components/my-contribution-tab.vue'
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
const currentTabIndex = computed(() => statusOptions.indexOf(activeStatusIndex.value))
const statusMap: Record<StatusOption, undefined | 'pending' | 'approved' | 'rejected'> = {
  全部: undefined,
  审核中: 'pending',
  已通过: 'approved',
  未通过: 'rejected',
}

const selectedItem = ref<UserPhotoVM | null>(null)

function openDetail(item: UserPhotoVM) {
  const statusStr = String(item.status || '').toLowerCase()
  if (statusStr === 'approved' || statusStr === 'published') {
    uni.navigateTo({ url: withQuery(AppRoute.QuestionDetail, { id: item.id }) })
    return
  }
  selectedItem.value = item
}
</script>

<template>
  <view class="page-my-contributions swiper-page bg-tx-main px-3 pt-3">
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
        <MyContributionTab
          :status="statusMap[opt]"
          :active="activeStatusIndex === opt"
          @open-detail="openDetail"
          @login="loginDirectly"
        />
      </swiper-item>
    </swiper>

    <ContributionDetailModal v-model:item="selectedItem" />
  </view>
</template>
