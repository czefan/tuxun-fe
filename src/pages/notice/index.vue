<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import TabHeader from '@/components/tab-header/tab-header.vue'
import AnnouncementList from '@/features/notification/components/announcement-list.vue'
import InteractionList from '@/features/notification/components/interaction-list.vue'
import {
  useInfiniteAnnouncements,
  useInfiniteInteractions,
  useMarkAllInteractionsRead,
  useMarkInteractionRead,
} from '@/features/notification/query'
import { useInfiniteListPage } from '@/composables/use-infinite-list-page'
import type { AnnouncementVM, InteractionMessageVM } from '@/features/notification/types'
import { useAuth } from '@/features/user/composables/use-auth'
import { AppRoute, withQuery } from '@/router/routes'
import { StorageKey } from '@/constants/storage'
import { debounce } from '@/utils/debounce'

definePage({
  style: {
    navigationBarTitleText: '%page.notice%',
    enablePullDownRefresh: true,
  },
})

const { isLoggedIn, loginDirectly } = useAuth()
const tabOptions = ['系统通知', '互动消息'] as const
type TabOption = (typeof tabOptions)[number]
const activeTab = ref<TabOption>('系统通知')

const searchKeyword = ref('')
const debouncedKeyword = ref('')
const setKeyword = debounce((val: string) => {
  debouncedKeyword.value = val
}, 300)
watch(searchKeyword, setKeyword)
onUnmounted(() => setKeyword.cancel())

const showSearchInput = ref(false)

watch(activeTab, () => {
  showSearchInput.value = false
  searchKeyword.value = ''
  debouncedKeyword.value = ''
})

const {
  data: announcePagesData,
  isLoading: announceLoading,
  isError: announceError,
  fetchNextPage: fetchNextAnnounce,
  hasNextPage: hasNextAnnounce,
  isFetchingNextPage: isFetchingAnnounce,
  refetch: refetchAnnounce,
} = useInfiniteAnnouncements(
  computed(() => ({
    keyword: debouncedKeyword.value.trim() || undefined,
  })),
  {
    enabled: computed(() => isLoggedIn()),
  },
)

const {
  data: interactPagesData,
  isLoading: interactLoading,
  isError: interactError,
  fetchNextPage: fetchNextInteract,
  hasNextPage: hasNextInteract,
  isFetchingNextPage: isFetchingInteract,
  refetch: refetchInteract,
} = useInfiniteInteractions(
  computed(() => undefined),
  {
    enabled: computed(() => isLoggedIn()),
  },
)

const markReadMutation = useMarkInteractionRead()
const markAllReadMutation = useMarkAllInteractionsRead()

const announcements = computed<AnnouncementVM[]>(
  () => announcePagesData.value?.pages.flatMap((page) => page.list) ?? [],
)
const interactions = computed<InteractionMessageVM[]>(
  () => interactPagesData.value?.pages.flatMap((page) => page.list) ?? [],
)

const unreadInteractCount = computed(() => interactPagesData.value?.pages[0]?.unreadCount ?? 0)

useInfiniteListPage({
  hasNextPage: hasNextAnnounce,
  isFetchingNextPage: isFetchingAnnounce,
  fetchNextPage: fetchNextAnnounce,
  refetch: refetchAnnounce,
  enabled: () => activeTab.value === '系统通知',
})

useInfiniteListPage({
  hasNextPage: hasNextInteract,
  isFetchingNextPage: isFetchingInteract,
  fetchNextPage: fetchNextInteract,
  refetch: refetchInteract,
  enabled: () => activeTab.value === '互动消息',
})

function handleInteractionTap(item: InteractionMessageVM) {
  if (!item.isRead) {
    markReadMutation.mutate(item.id)
  }
  if (!item.photoId) return
  const tab =
    item.relatedType === 'solve'
      ? 'solves'
      : item.relatedType === 'comment' || item.type === 'comment'
        ? 'comments'
        : undefined
  uni.navigateTo({ url: withQuery(AppRoute.QuestionDetail, { id: item.photoId, tab }) })
}

function handleReadAllInteractions() {
  markAllReadMutation.mutate(undefined, {
    onSuccess: () => {
      uni.showToast({ title: '已全部标记为已读', icon: 'none' })
    },
  })
}

const readAnnouncementIds = ref<number[]>(loadReadAnnouncementIds())

function loadReadAnnouncementIds(): number[] {
  try {
    const data = uni.getStorageSync(StorageKey.ReadNoticeIds)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function markAnnouncementRead(id: number) {
  if (!readAnnouncementIds.value.includes(id)) {
    readAnnouncementIds.value.push(id)
    uni.setStorageSync(StorageKey.ReadNoticeIds, JSON.stringify(readAnnouncementIds.value))
  }
}

const unreadAnnounceCount = computed(() => {
  if (!isLoggedIn() || !announcements.value.length) return 0
  return announcements.value.filter(
    (a: AnnouncementVM) => !a.isRead && !readAnnouncementIds.value.includes(a.id),
  ).length
})

const unreadMap = computed<Record<TabOption, number>>(() => ({
  系统通知: unreadAnnounceCount.value,
  互动消息: unreadInteractCount.value,
}))

const currentTabIndex = computed(() => tabOptions.indexOf(activeTab.value))

function goAnnouncementDetail(id: number) {
  markAnnouncementRead(id)
  uni.navigateTo({ url: withQuery(AppRoute.NoticeDetail, { id }) })
}
</script>

<template>
  <view class="page-notice swiper-page bg-tx-main px-3 pt-3">
    <!-- 融入页面的顶栏 Seamless Sub Tabs 导航 -->
    <TabHeader v-model="activeTab" :options="tabOptions">
      <template #label="{ option }">
        <view class="flex items-center gap-1.5">
          <text>{{ option }}</text>
          <view v-if="isLoggedIn() && unreadMap[option]" class="h-2 w-2 rounded-full bg-rose-500" />
        </view>
      </template>

      <!-- 右侧：仅在系统通知 Tab 显示搜索图标按钮 + 互动消息的一键已读按钮 -->
      <template #actions="{ active }">
        <view
          v-if="active === '系统通知'"
          class="h-7 w-7 flex cursor-pointer items-center justify-center rounded-full transition-all active:scale-90"
          :class="
            showSearchInput
              ? 'bg-tx-brown text-white shadow-2xs'
              : 'text-tx-ink-2 hover:text-tx-ink'
          "
          @tap="showSearchInput = !showSearchInput"
        >
          <text class="i-carbon-search text-base" />
        </view>
        <template v-if="active === '互动消息' && unreadInteractCount">
          <view
            class="cursor-pointer text-sm text-tx-brown font-black transition-opacity active:opacity-75"
            @tap="handleReadAllInteractions"
          >
            一键已读
          </view>
        </template>
      </template>
    </TabHeader>

    <!-- 下拉展开的搜索框容器（自动聚焦光标） -->
    <view
      v-if="activeTab === '系统通知' && showSearchInput"
      class="w-full border-b border-tx-border/50 pb-2 pt-2"
    >
      <wd-search
        v-model="searchKeyword"
        :focus="true"
        placeholder="搜索标题或正文..."
        hide-cancel
        custom-class="tx-search"
        placeholder-left
        @clear="searchKeyword = ''"
      />
    </view>

    <!-- 可左右手势滑动的 Swiper 容器 (全屏物理宽度，零裁剪) -->
    <swiper
      class="box-border min-h-0 w-[calc(100%+24px)] flex-1 -mx-3"
      :current="currentTabIndex"
      :duration="300"
      @change="(e) => (activeTab = tabOptions[e.detail.current])"
    >
      <!-- 滑块 1：系统通知 -->
      <swiper-item class="box-border">
        <AnnouncementList
          :items="announcements"
          :loading="announceLoading"
          :error="announceError"
          :is-fetching-next-page="isFetchingAnnounce"
          :is-logged-in="isLoggedIn()"
          :read-ids="readAnnouncementIds"
          @login="loginDirectly"
          @reload="refetchAnnounce"
          @load-more="fetchNextAnnounce"
          @select="goAnnouncementDetail"
        />
      </swiper-item>

      <!-- 滑块 2：互动消息 -->
      <swiper-item class="box-border">
        <InteractionList
          :items="interactions"
          :loading="interactLoading"
          :error="interactError"
          :is-fetching-next-page="isFetchingInteract"
          :is-logged-in="isLoggedIn()"
          @login="loginDirectly"
          @reload="refetchInteract"
          @load-more="fetchNextInteract"
          @select="handleInteractionTap"
        />
      </swiper-item>
    </swiper>
  </view>
</template>
