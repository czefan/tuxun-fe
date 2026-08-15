<script setup lang="ts">
import { computed, ref } from 'vue'
import { onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { useContent } from '@/features/content/query'
import { useUserStore } from '@/features/user'
import { useAuth } from '@/features/user/composables/use-auth'
import { useInfiniteScoreLogs } from '@/features/score/query'
import { SCORE_REASON_TEXT } from '@/features/score/text'
import type { ScoreLogVM } from '@/features/score/types'
import { AppRoute, withQuery } from '@/router/routes'

definePage({
  style: {
    navigationBarTitleText: '%page.points%',
    enablePullDownRefresh: true,
  },
})

const { isLoggedIn, loginDirectly } = useAuth()
const activeTab = ref('积分明细')
const userStore = useUserStore()
const tabOptions = ['积分明细', '积分规则']
const currentTabIndex = computed(() => tabOptions.indexOf(activeTab.value))

const { data: rulesData } = useContent('score_rules')

const {
  data: logsPagesData,
  isLoading: logsLoading,
  isError: logsError,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  refetch,
} = useInfiniteScoreLogs()

const logsList = computed<ScoreLogVM[]>(() => logsPagesData.value?.pages.flatMap(page => page.list) ?? [])

const totalIncome = computed(() => logsPagesData.value?.pages?.[0]?.totalIncome ?? 0)
const totalExpense = computed(() => logsPagesData.value?.pages?.[0]?.totalExpense ?? 0)

onReachBottom(() => {
  if (hasNextPage?.value && !isFetchingNextPage.value && activeTab.value === '积分明细') {
    fetchNextPage()
  }
})

onPullDownRefresh(async () => {
  await refetch()
  uni.stopPullDownRefresh()
})

function handleLogTap(item: ScoreLogVM) {
  if (item.reason === 'exchange') {
    return
  }
  if (item.relatedType === 'photo' && item.relatedId) {
    uni.navigateTo({ url: withQuery(AppRoute.QuestionDetail, { id: item.relatedId }) })
  }
}
</script>

<template>
  <view class="page-points swiper-page bg-[#F1DFC5] px-3 pt-3">
    <!-- 融入页面的顶栏 Seamless Sub Tab 切换器 (与全站完全统一的 16px 标头) -->
    <view class="flex flex-shrink-0 items-end justify-between px-1 pb-0" style="border-bottom: 1px solid rgba(211, 186, 159, 0.5);">
      <view class="flex items-center gap-6">
        <view
          v-for="opt in tabOptions"
          :key="opt"
          class="relative cursor-pointer pb-2.5 text-base transition-all active:scale-95"
          :class="activeTab === opt ? 'text-[#1E1E1E] font-black' : 'text-[#8A7E70] font-bold'"
          @tap="activeTab = opt"
        >
          <text>{{ opt }}</text>
          <view
            v-if="activeTab === opt"
            class="absolute left-0 right-0 h-[2.5px] rounded-full bg-[#B69171] -bottom-[1px]"
          />
        </view>
      </view>
      <!-- 右侧总积分与收入支出 (仅占 Tab 这一行，左侧附带积分图标，简短文字说明只含“收入”“支出”) -->
      <view class="flex items-center gap-2 pb-2.5">
        <view class="flex items-center gap-1">
          <text class="i-my-icons-points text-lg text-[#B69171]" />
          <text class="text-xl text-[#1E1E1E] font-bold leading-none font-numeric">
            {{ isLoggedIn() ? (userStore.userInfo?.points ?? 0) : '--' }}
          </text>
        </view>

        <view class="flex flex-col justify-center gap-0.5 text-[10px] leading-tight">
          <view class="flex items-center gap-0.5 text-[#756C5E]">
            <text>收入</text>
            <text class="text-[#B69171] font-bold font-numeric">
              {{ isLoggedIn() ? `+${totalIncome}` : '--' }}
            </text>
          </view>
          <view class="flex items-center gap-0.5 text-[#756C5E]">
            <text>支出</text>
            <text class="text-[#1E1E1E] font-bold font-numeric">
              {{ isLoggedIn() ? `-${totalExpense}` : '--' }}
            </text>
          </view>
        </view>
      </view>
    </view>

    <!-- 支持左右平滑手势连贯滑屏的 Swiper 容器 -->
    <swiper
      class="box-border min-h-0 w-[calc(100%+24px)] flex-1 -mx-3"
      :current="currentTabIndex"
      :duration="300"
      @change="(e) => activeTab = tabOptions[e.detail.current]"
    >
      <!-- 滑块 1：积分明细 -->
      <swiper-item class="box-border">
        <scroll-view scroll-y :show-scrollbar="false" class="hide-scrollbar box-border h-full w-full" @scrolltolower="() => fetchNextPage()">
          <view v-if="!isLoggedIn()" class="min-h-full flex flex-col items-center justify-center -mt-6">
            <wd-empty icon="no-result" tip="登录后查看积分明细" />
            <wd-button size="small" round type="warning" custom-class="!mt-4 !font-bold shadow-md" @click="loginDirectly">
              去登录
            </wd-button>
          </view>
          <view v-else class="bottom-space px-3 pt-2.5 space-y-3">
            <view v-if="logsLoading" class="space-y-3">
              <wd-skeleton animation="gradient" :row-col="[{ width: '100%', height: '50px' }, { width: '100%', height: '50px' }]" />
            </view>
            <view v-else-if="logsError" class="flex flex-col items-center justify-center gap-3 py-20">
              <wd-empty icon="network-error" tip="加载失败，请检查网络后重试" />
              <wd-button size="small" plain round @click="refetch">
                重新加载
              </wd-button>
            </view>
            <view v-else-if="logsList.length">
              <view class="border-y border-[#B69171]">
                <view
                  v-for="(item, index) in logsList"
                  :key="item.id"
                  class="flex items-center justify-between py-3.5 transition-colors"
                  :class="[
                    { 'border-t border-[#B69171]': index > 0 },
                    item.reason !== 'exchange' && item.relatedType === 'photo' && item.relatedId ? 'cursor-pointer active:opacity-75' : '',
                  ]"
                  @tap="handleLogTap(item)"
                >
                  <view class="mr-2 min-w-0 flex-1 space-y-1">
                    <view class="flex items-center gap-1.5 truncate">
                      <text class="u-title-base font-bold">
                        {{ SCORE_REASON_TEXT[item.reason] || '积分变动' }}
                      </text>
                      <text v-if="item.relatedTitle" class="truncate u-meta-sub font-medium">
                        · {{ item.relatedTitle }}
                      </text>
                    </view>
                    <text class="block u-meta-time">{{ item.createdAt }}</text>
                  </view>
                  <text
                    class="u-num-stat font-bold"
                    :class="item.delta > 0 ? 'text-[#B69171]' : item.delta < 0 ? 'text-[#1E1E1E]' : 'text-[#8A7E70]'"
                  >
                    {{ item.delta > 0 ? `+${item.delta}` : item.delta }}
                  </text>
                </view>
              </view>

              <wd-loadmore
                v-if="isFetchingNextPage"
                :state="isFetchingNextPage ? 'loading' : undefined"
                @reload="fetchNextPage"
              />
            </view>
            <view v-else class="py-16">
              <wd-empty icon="no-result" tip="暂无积分明细" />
            </view>
          </view>
        </scroll-view>
      </swiper-item>

      <!-- 滑块 2：积分规则 -->
      <swiper-item class="box-border">
        <scroll-view scroll-y :show-scrollbar="false" class="hide-scrollbar box-border h-full w-full">
          <view class="bottom-space px-3 pt-2.5">
            <view v-if="rulesData?.content" class="border-y border-[#B69171] px-1 pb-3 pt-2">
              <!-- 不带字号/颜色 class（同 help/弹窗/通知详情）：H5 端 rich-text 内容继承容器样式会改字号，小程序端不继承，两端需一致 -->
              <rich-text :nodes="rulesData.content" class="block break-words" />
            </view>
            <view v-else class="py-16">
              <wd-empty icon="no-result" tip="暂无积分规则说明" />
            </view>
          </view>
        </scroll-view>
      </swiper-item>
    </swiper>
  </view>
</template>
