<script setup lang="ts">
import { computed, ref } from 'vue'
import TabHeader from '@/components/tab-header/tab-header.vue'
import { useContent } from '@/features/content/query'
import { useUserStore } from '@/features/user/store/user'
import { useAuth } from '@/features/user/composables/use-auth'
import { useInfiniteScoreLogs } from '@/features/score/query'
import { useInfiniteListPage } from '@/composables/use-infinite-list-page'
import { SCORE_REASON_TEXT } from '@/features/score/text'
import type { ScoreLogVM } from '@/features/score/types'
import { AppRoute, withQuery } from '@/router/routes'
import ListStateView from '@/components/list-state-view/list-state-view.vue'

definePage({
  style: {
    navigationBarTitleText: '%page.points%',
    enablePullDownRefresh: true,
  },
})

const { isLoggedIn, loginDirectly } = useAuth()
const tabOptions = ['积分明细', '积分规则'] as const
type TabOption = (typeof tabOptions)[number]
const activeTab = ref<TabOption>('积分明细')
const currentTabIndex = computed(() => tabOptions.indexOf(activeTab.value))
const userStore = useUserStore()

const { data: rulesData } = useContent('score_rules')

const {
  isFetching,
  isStale,
  data: logsPagesData,
  isLoading: logsLoading,
  isError: logsError,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  refetch,
} = useInfiniteScoreLogs()

const logsList = computed<ScoreLogVM[]>(
  () => logsPagesData.value?.pages.flatMap((page) => page.list) ?? [],
)

const totalIncome = computed(() => logsPagesData.value?.pages?.[0]?.totalIncome ?? 0)
const totalExpense = computed(() => logsPagesData.value?.pages?.[0]?.totalExpense ?? 0)

const { loadMore } = useInfiniteListPage({
  isFetching,
  isStale,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  refetch,
  enabled: () => isLoggedIn() && activeTab.value === '积分明细',
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
  <view class="page-points swiper-page bg-tx-main px-3 pt-3">
    <!-- 融入页面的顶栏 Seamless Sub Tab 切换器 -->
    <TabHeader v-model="activeTab" :options="tabOptions">
      <!-- 右侧总积分与收入支出 -->
      <template #actions>
        <view class="flex items-center gap-2">
          <view class="flex items-center gap-1">
            <text class="i-my-icons-points text-lg text-tx-brown" />
            <text class="text-xl text-tx-ink font-bold leading-none font-numeric">
              {{ isLoggedIn() ? (userStore.userInfo?.points ?? 0) : '--' }}
            </text>
          </view>

          <view class="flex flex-col justify-center gap-0.5 text-[10px] leading-tight">
            <view class="flex items-center gap-0.5 text-tx-ink-2">
              <text>收入</text>
              <text class="text-tx-brown font-bold font-numeric">
                {{ isLoggedIn() ? `+${totalIncome}` : '--' }}
              </text>
            </view>
            <view class="flex items-center gap-0.5 text-tx-ink-2">
              <text>支出</text>
              <text class="text-tx-ink font-bold font-numeric">
                {{ isLoggedIn() ? `-${totalExpense}` : '--' }}
              </text>
            </view>
          </view>
        </view>
      </template>
    </TabHeader>

    <!-- 支持左右平滑连贯拖拽滑屏的 Swiper 容器 -->
    <swiper
      class="box-border min-h-0 w-[calc(100%+24px)] flex-1 -mx-3"
      :current="currentTabIndex"
      :duration="300"
      @change="(e) => (activeTab = tabOptions[e.detail.current])"
    >
      <!-- 滑块 1：积分明细 -->
      <swiper-item class="box-border">
        <scroll-view
          scroll-y
          :show-scrollbar="false"
          class="hide-scrollbar box-border h-full w-full"
          @scrolltolower="loadMore"
        >
          <ListStateView
            :needs-login="!isLoggedIn()"
            :loading="logsLoading"
            :error="logsError && !logsList.length"
            :empty="!logsList.length"
            login-tip="登录后查看积分明细"
            empty-tip="暂无积分明细"
            loading-variant="spinner"
            @login="loginDirectly"
            @retry="refetch"
          >
            <!-- 正常列表 -->
            <view class="bottom-space px-3 pt-2.5 space-y-3">
              <view class="border-y border-tx-brown">
                <view
                  v-for="(item, index) in logsList"
                  :key="item.id"
                  class="flex items-center justify-between py-3.5 transition-colors"
                  :class="[
                    { 'border-t border-tx-brown': index > 0 },
                    item.reason !== 'exchange' && item.relatedType === 'photo' && item.relatedId
                      ? 'cursor-pointer active:opacity-75'
                      : '',
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
                    :class="
                      item.delta > 0
                        ? 'text-tx-brown'
                        : item.delta < 0
                          ? 'text-tx-ink'
                          : 'text-tx-ink-3'
                    "
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
          </ListStateView>
        </scroll-view>
      </swiper-item>

      <!-- 滑块 2：积分规则 -->
      <swiper-item class="box-border">
        <scroll-view
          scroll-y
          :show-scrollbar="false"
          class="hide-scrollbar box-border h-full w-full"
        >
          <view class="bottom-space px-3 pt-2.5">
            <view v-if="rulesData?.content" class="border-y border-tx-brown px-1 pb-3 pt-2">
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
