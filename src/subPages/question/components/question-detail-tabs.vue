<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import SolveList from '@/features/attempt/components/solve-list.vue'
import MyAttemptList from '@/features/attempt/components/my-attempt-list.vue'
import CommentList from '@/features/comment/components/comment-list.vue'
import ListStateView from '@/components/list-state-view/list-state-view.vue'
import { useInfiniteCommentList } from '@/features/comment/query'
import { useInfiniteMyAttemptsList, useInfiniteSolvesList } from '@/features/attempt/query'
import type { MyAttemptVM, SolveRecordVM } from '@/features/attempt/types'
import { useAuth } from '@/features/user/composables/use-auth'
import { formatCompactCount } from '@/utils/format-count'

interface Props {
  questionId: number
  solvedCount?: number
  userAttemptsCount?: number
  initialTab?: 'comments' | 'solves' | 'myAttempts'
  commentText?: string
}

const props = withDefaults(defineProps<Props>(), {
  solvedCount: 0,
  userAttemptsCount: 0,
  initialTab: 'comments',
  commentText: '',
})

const emit = defineEmits<{
  (e: 'open-comment-input'): void
}>()

const detailTabsList = ['comments', 'solves', 'myAttempts'] as const
type DetailTab = (typeof detailTabsList)[number]

const activeTab = ref<DetailTab>(props.initialTab)
watch(
  () => props.initialTab,
  (tab) => {
    if (tab && detailTabsList.includes(tab)) {
      activeTab.value = tab
    }
  },
)

const currentTabIndex = computed(() => {
  const idx = detailTabsList.indexOf(activeTab.value)
  return idx >= 0 ? idx : 0
})

type CommentSortType = 'hottest' | 'latest'
const commentSortType = ref<CommentSortType>('hottest')
const showCommentSortPopover = ref(false)
const commentSortBy = computed(() =>
  commentSortType.value === 'latest' ? 'created_at' : 'likes_count',
)

function handleTabClick(tab: DetailTab) {
  if (tab === 'comments' && activeTab.value === 'comments') {
    showCommentSortPopover.value = !showCommentSortPopover.value
  } else {
    activeTab.value = tab
    showCommentSortPopover.value = false
  }
}

const { isLoggedIn, loginDirectly } = useAuth()

const { data: commentPagesData } = useInfiniteCommentList(
  computed(() => props.questionId),
  computed(() => ({ sort_by: commentSortBy.value })),
)
const commentTotal = computed(() => commentPagesData.value?.pages[0]?.total ?? 0)

const listParams = { page_size: 20 }
const {
  data: solvesPagesData,
  isLoading: isSolvesLoading,
  fetchNextPage: fetchNextSolves,
  hasNextPage: hasNextSolves,
  isFetchingNextPage: isFetchingSolves,
} = useInfiniteSolvesList(
  computed(() => props.questionId),
  listParams,
)

const myAttemptsPhotoId = computed(() => (isLoggedIn() ? props.questionId : 0))
const {
  data: myAttemptsPagesData,
  isLoading: isMyAttemptsLoading,
  fetchNextPage: fetchNextMyAttempts,
  hasNextPage: hasNextMyAttempts,
  isFetchingNextPage: isFetchingMyAttempts,
} = useInfiniteMyAttemptsList(myAttemptsPhotoId, listParams)

const solves = computed<SolveRecordVM[]>(
  () => solvesPagesData.value?.pages.flatMap((page) => page.list) ?? [],
)
const myAttempts = computed<MyAttemptVM[]>(
  () => myAttemptsPagesData.value?.pages.flatMap((page) => page.list) ?? [],
)
</script>

<template>
  <!-- 评论区、已破解与我的作答 3 合 1 可左右滑动相连卡片 -->
  <view
    class="shadow-2xs relative overflow-visible border border-tx-border rounded-[18px] bg-white pb-2 pt-3"
    @click="showCommentSortPopover = false"
  >
    <!-- 融入卡片顶部的无缝 Tab 标头：指示线无留白紧贴浅分割线 -->
    <view class="relative z-30 flex items-center justify-around px-4 pb-0 pt-1 u-divider-b">
      <view
        v-for="tab in [
          { value: 'comments' as const, label: `评论 ${formatCompactCount(commentTotal)}` },
          {
            value: 'solves' as const,
            label: `已破解 ${formatCompactCount(solvedCount)}`,
          },
          { value: 'myAttempts' as const, label: `我的作答 ${userAttemptsCount}` },
        ]"
        :key="tab.value"
        class="relative flex cursor-pointer items-center gap-1.5 pb-2.5 transition-colors active:opacity-75"
        :class="activeTab === tab.value ? 'u-tab-active' : 'u-tab-inactive'"
        @click.stop="handleTabClick(tab.value)"
      >
        <text>{{ tab.label }}</text>
        <!-- 评论右侧：上宽下窄 3 条横线图标 -->
        <view
          v-if="tab.value === 'comments'"
          class="ml-0.5 w-3.5 flex flex-col items-start justify-center gap-0.75"
        >
          <view class="h-[2px] w-full rounded-full bg-tx-ink-2" />
          <view class="h-[2px] w-[70%] rounded-full bg-tx-ink-2" />
          <view class="h-[2px] w-[40%] rounded-full bg-tx-ink-2" />
        </view>

        <!-- 切换指示线：紧贴压在标头底部的浅分割线上 (-bottom-[1px])，无任何留白 -->
        <view
          v-if="activeTab === tab.value"
          class="absolute left-0 right-0 h-[2.5px] rounded-full bg-tx-brown -bottom-[1px]"
        />
      </view>
    </view>

    <!-- 评论排序下拉气泡 -->
    <view
      v-if="activeTab === 'comments' && showCommentSortPopover"
      class="absolute left-4 top-[52px] z-50 min-w-[132px] border border-tx-border/40 rounded-2xl bg-white p-2 text-left font-normal shadow-2xl space-y-1"
      @click.stop
    >
      <view
        v-for="opt in [
          { key: 'hottest', label: '最多点赞' },
          { key: 'latest', label: '最新' },
        ] as const"
        :key="opt.key"
        class="flex cursor-pointer items-center justify-between rounded-xl px-3.5 py-2.5 text-sm transition-colors active:bg-tx-surface"
        :class="commentSortType === opt.key ? 'font-bold text-tx-ink' : 'text-[#555555]'"
        @click="
          () => {
            commentSortType = opt.key
            showCommentSortPopover = false
          }
        "
      >
        <text>{{ opt.label }}</text>
        <text
          v-if="commentSortType === opt.key"
          class="i-carbon-checkmark text-base text-tx-brown font-bold"
        />
      </view>
    </view>

    <!-- Swiper 面板 -->
    <swiper
      class="h-[420px] w-full"
      :current="currentTabIndex"
      :duration="300"
      @change="
        (e) => {
          activeTab = detailTabsList[e.detail.current]
          showCommentSortPopover = false
        }
      "
    >
      <swiper-item class="box-border">
        <CommentList
          v-if="questionId > 0"
          :photo-id="questionId"
          :sort-by="commentSortBy"
          :comment-text="commentText"
          @open-input="emit('open-comment-input')"
        />
      </swiper-item>
      <swiper-item class="box-border">
        <scroll-view
          scroll-y
          :show-scrollbar="false"
          class="hide-scrollbar box-border h-full w-full"
        >
          <SolveList
            :list="solves"
            :loading="isSolvesLoading"
            :photo-id="questionId"
            :has-next-page="hasNextSolves"
            :is-fetching-next-page="isFetchingSolves"
            @fetch-next-page="fetchNextSolves"
          />
        </scroll-view>
      </swiper-item>
      <swiper-item class="box-border">
        <ListStateView
          :needs-login="!isLoggedIn()"
          login-tip="登录后查看我的作答"
          center-class="h-full flex flex-col items-center justify-center -mt-6"
          @login="loginDirectly"
        >
          <scroll-view
            scroll-y
            :show-scrollbar="false"
            class="hide-scrollbar box-border h-full w-full"
          >
            <MyAttemptList
              :list="myAttempts"
              :loading="isMyAttemptsLoading"
              :has-next-page="hasNextMyAttempts"
              :is-fetching-next-page="isFetchingMyAttempts"
              @load-more="fetchNextMyAttempts"
            />
          </scroll-view>
        </ListStateView>
      </swiper-item>
    </swiper>
  </view>
</template>
