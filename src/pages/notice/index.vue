<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import {
  useInfiniteAnnouncements,
  useInfiniteInteractions,
  useMarkAllInteractionsRead,
  useMarkInteractionRead,
} from '@/features/notification/query'
import type { AnnouncementVM, InteractionMessageVM } from '@/features/notification/types'
import { useAuth } from '@/features/user/composables/use-auth'
import { AppRoute, withQuery } from '@/router/routes'
import { formatRelativeTime } from '@/utils/date'
import { debounce } from '@/utils/debounce'

definePage({
  style: {
    navigationBarTitleText: '%page.notice%',
    enablePullDownRefresh: true,
  },
})

const { isLoggedIn, isMe, loginDirectly } = useAuth()
const activeTab = ref('系统通知')
const tabOptions = ['系统通知', '互动消息']

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
  isPending: announceLoading,
  fetchNextPage: fetchNextAnnounce,
  hasNextPage: hasNextAnnounce,
  isFetchingNextPage: isFetchingAnnounce,
  refetch: refetchAnnounce,
} = useInfiniteAnnouncements(computed(() => ({
  keyword: debouncedKeyword.value.trim() || undefined,
})))

const {
  data: interactPagesData,
  isPending: interactLoading,
  fetchNextPage: fetchNextInteract,
  hasNextPage: hasNextInteract,
  isFetchingNextPage: isFetchingInteract,
  refetch: refetchInteract,
} = useInfiniteInteractions(computed(() => undefined), {
  enabled: computed(() => isLoggedIn()),
})

const markReadMutation = useMarkInteractionRead()
const markAllReadMutation = useMarkAllInteractionsRead()

const announcements = computed<AnnouncementVM[]>(() => announcePagesData.value?.pages.flatMap(page => page.list) ?? [])
const interactions = computed<InteractionMessageVM[]>(() => interactPagesData.value?.pages.flatMap(page => page.list) ?? [])

const unreadInteractCount = computed(() => interactPagesData.value?.pages[0]?.unreadCount ?? 0)

onReachBottom(() => {
  if (activeTab.value === '系统通知') {
    if (hasNextAnnounce?.value && !isFetchingAnnounce.value) {
      fetchNextAnnounce()
    }
  }
  else {
    if (hasNextInteract?.value && !isFetchingInteract.value) {
      fetchNextInteract()
    }
  }
})

onPullDownRefresh(async () => {
  if (activeTab.value === '系统通知') {
    await refetchAnnounce()
  }
  else {
    await refetchInteract()
  }
  uni.stopPullDownRefresh()
})

interface TimeGroup<T> {
  title: string
  list: T[]
}

function groupItemsByTime<T extends { createdAt: string, rawCreatedAt?: string }>(items: T[]): TimeGroup<T>[] {
  if (!items || items.length === 0)
    return []

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay()
  const thisWeekStart = todayStart - (dayOfWeek - 1) * 86400000
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()

  const getTimestamp = (item: T): number => {
    if (item.rawCreatedAt) {
      const t = new Date(item.rawCreatedAt).getTime()
      if (!Number.isNaN(t))
        return t
    }
    if (typeof item.createdAt === 'string') {
      if (item.createdAt.includes('刚刚') || item.createdAt.includes('今天'))
        return Date.now()
      if (item.createdAt.includes('昨天'))
        return Date.now() - 86400000
    }
    const t = new Date(item.createdAt).getTime()
    // 相对字符串 "MM-DD HH:mm" 会被 new Date() 误解析成 2001 年，视为无效，避免分错组
    if (!Number.isNaN(t)) {
      const parsedYear = new Date(t).getFullYear()
      if (!(parsedYear === 2001 && !item.createdAt.includes('2001')))
        return t
    }
    return 0
  }

  const sorted = [...items].sort((a, b) => getTimestamp(b) - getTimestamp(a))

  const thisWeek: T[] = []
  const thisMonth: T[] = []
  const earlier: T[] = []

  sorted.forEach((item) => {
    const time = getTimestamp(item)
    if (time >= thisWeekStart) {
      thisWeek.push(item)
    }
    else if (time >= thisMonthStart) {
      thisMonth.push(item)
    }
    else {
      earlier.push(item)
    }
  })

  const result: TimeGroup<T>[] = []
  if (thisWeek.length > 0)
    result.push({ title: '本周', list: thisWeek })
  if (thisMonth.length > 0)
    result.push({ title: '本月', list: thisMonth })
  if (earlier.length > 0)
    result.push({ title: '更早', list: earlier })

  if (result.length === 0 && items.length > 0) {
    result.push({ title: '更早', list: items })
  }

  return result
}

const groupedAnnouncements = computed(() => groupItemsByTime(announcements.value))
const groupedInteractions = computed(() => groupItemsByTime(interactions.value))

function handleInteractionTap(item: InteractionMessageVM) {
  if (!item.isRead) {
    markReadMutation.mutate(item.id)
  }
  if (item.photoId) {
    uni.navigateTo({ url: withQuery(AppRoute.QuestionDetail, { id: item.photoId }) })
  }
}

function handleReadAllInteractions() {
  markAllReadMutation.mutate(undefined, {
    onSuccess: () => {
      uni.showToast({ title: '已全部标记为已读', icon: 'none' })
    },
  })
}

const READ_ANNOUNCEMENTS_KEY = 'tuxun_read_announcements'
const readAnnouncementIds = ref<number[]>(loadReadAnnouncementIds())

function loadReadAnnouncementIds(): number[] {
  try {
    const data = uni.getStorageSync(READ_ANNOUNCEMENTS_KEY)
    return data ? JSON.parse(data) : []
  }
  catch {
    return []
  }
}

function isAnnouncementRead(id: number): boolean {
  return readAnnouncementIds.value.includes(id)
}

function markAnnouncementRead(id: number) {
  if (!readAnnouncementIds.value.includes(id)) {
    readAnnouncementIds.value.push(id)
    uni.setStorageSync(READ_ANNOUNCEMENTS_KEY, JSON.stringify(readAnnouncementIds.value))
  }
}

const unreadAnnounceCount = computed(() => {
  if (!isLoggedIn() || !announcements.value.length)
    return 0
  return announcements.value.filter((a: AnnouncementVM) => !readAnnouncementIds.value.includes(a.id)).length
})

function goAnnouncementDetail(id: number) {
  markAnnouncementRead(id)
  uni.navigateTo({ url: withQuery(AppRoute.NoticeDetail, { id }) })
}
const currentTabIndex = computed(() => tabOptions.indexOf(activeTab.value))
</script>

<template>
  <view class="page-notice swiper-page bg-[#F1DFC5] px-3 pt-3">
    <!-- 融入页面的顶栏 Seamless Sub Tabs 导航 -->
    <view class="flex flex-shrink-0 items-end justify-between px-1 pb-0" style="border-bottom: 1px solid rgba(211, 186, 159, 0.5);">
      <view class="flex items-center gap-6">
        <view
          v-for="opt in tabOptions"
          :key="opt"
          class="relative flex cursor-pointer items-center gap-1.5 pb-2.5 text-base transition-all active:scale-95"
          :class="activeTab === opt ? 'text-[#1E1E1E] font-black' : 'text-[#8A7E70] font-bold'"
          @tap="activeTab = opt"
        >
          <text>{{ opt }}</text>
          <view v-if="isLoggedIn() && opt === '系统通知' && unreadAnnounceCount" class="h-2 w-2 rounded-full bg-rose-500" />
          <view v-if="isLoggedIn() && opt === '互动消息' && unreadInteractCount" class="h-2 w-2 rounded-full bg-rose-500" />
          <view
            v-if="activeTab === opt"
            class="absolute left-0 right-0 h-[2.5px] rounded-full bg-[#B69171] -bottom-[1px]"
          />
        </view>
      </view>

      <!-- 右侧：仅在系统通知 Tab 显示搜索图标按钮 + 互动消息的一键已读按钮 (固定 h-7 防止无节点时高度塌陷上顶) -->
      <view class="h-7 flex items-center gap-2.5 pb-2.5">
        <view
          v-if="activeTab === '系统通知'"
          class="h-7 w-7 flex cursor-pointer items-center justify-center rounded-full transition-all active:scale-90"
          :class="showSearchInput ? 'bg-[#B69171] text-white shadow-2xs' : 'text-[#756C5E] hover:text-[#1E1E1E]'"
          @tap="showSearchInput = !showSearchInput"
        >
          <text class="i-carbon:search text-base" />
        </view>
        <template v-if="activeTab === '互动消息' && unreadInteractCount">
          <view
            class="cursor-pointer text-sm text-[#B69171] font-black transition-opacity active:opacity-75"
            @tap="handleReadAllInteractions"
          >
            一键已读
          </view>
        </template>
      </view>
    </view>

    <!-- 下拉展开的搜索框容器（自动聚焦光标） -->
    <view v-if="activeTab === '系统通知' && showSearchInput" class="w-full border-b border-[#D3BA9F]/50 pb-2 pt-2">
      <wd-search
        v-model="searchKeyword"
        :focus="true"
        placeholder="搜索系统通知主题..."
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
      @change="(e) => activeTab = tabOptions[e.detail.current]"
    >
      <!-- 滑块 1：系统通知 -->
      <swiper-item class="box-border">
        <scroll-view scroll-y :show-scrollbar="false" class="hide-scrollbar box-border h-full w-full" @scrolltolower="() => fetchNextAnnounce()">
          <view v-if="!isLoggedIn()" class="min-h-full flex flex-col items-center justify-center -mt-6">
            <wd-empty icon="no-result" tip="登录后查看系统通知" />
            <wd-button size="small" round type="warning" custom-class="!mt-4 !font-bold shadow-md" @click="loginDirectly">
              去登录
            </wd-button>
          </view>
          <view v-else class="bottom-space--bar px-3 pt-2.5 space-y-4">
            <view v-if="announceLoading" class="space-y-3">
              <wd-skeleton animation="gradient" :row-col="[{ width: '100%', height: '80px' }, { width: '100%', height: '80px' }]" />
            </view>
            <view v-else-if="announcements.length" class="space-y-4">
              <view
                v-for="group in groupedAnnouncements"
                :key="group.title"
                class="space-y-1.5"
              >
                <!-- 时间分组小标题 (本周 / 本月 / 更早) -->
                <text class="block px-1 text-xs text-[#8c5f38] font-black tracking-widest uppercase font-numeric">
                  {{ group.title }}
                </text>

                <view class="border-y border-[#B69171]">
                  <view
                    v-for="(item, index) in group.list"
                    :key="item.id"
                    class="cursor-pointer py-3.5 transition-colors space-y-1 active:opacity-70"
                    :class="[
                      { 'border-t border-[#B69171]': index > 0 },
                      !isAnnouncementRead(item.id) ? 'bg-[#F9DF95]/15 -mx-3 px-3' : '',
                    ]"
                    @tap="goAnnouncementDetail(item.id)"
                  >
                    <!-- 顶栏：标题 + 未读红点 + 格式化时间 -->
                    <view class="flex items-baseline justify-between gap-3">
                      <view class="min-w-0 flex flex-1 items-center gap-1.5">
                        <view v-if="!isAnnouncementRead(item.id)" class="h-2 w-2 flex-shrink-0 rounded-full bg-rose-500" />
                        <text
                          class="truncate text-base tracking-tight"
                          :class="!isAnnouncementRead(item.id) ? 'text-[#1E1E1E] font-black' : 'text-[#333333] font-bold'"
                        >
                          {{ item.title }}
                        </text>
                      </view>
                      <text class="flex-shrink-0 text-sm text-[#756C5E] font-bold font-numeric">
                        {{ formatRelativeTime(item.rawCreatedAt || item.createdAt, { showTime: false }) }}
                      </text>
                    </view>

                    <!-- 内容预览 -->
                    <text class="line-clamp-2 block text-sm leading-relaxed" :class="!isAnnouncementRead(item.id) ? 'text-[#333333]' : 'text-[#756C5E]'">
                      {{ item.contentPreview }}
                    </text>
                  </view>
                </view>
              </view>
            </view>
            <view v-else class="py-20">
              <wd-empty icon="no-result" tip="暂无系统通知" />
            </view>

            <wd-loadmore
              v-if="isFetchingAnnounce"
              :state="isFetchingAnnounce ? 'loading' : undefined"
              @reload="fetchNextAnnounce"
            />
          </view>
        </scroll-view>
      </swiper-item>

      <!-- 滑块 2：互动消息 -->
      <swiper-item class="box-border">
        <scroll-view scroll-y :show-scrollbar="false" class="hide-scrollbar box-border h-full w-full" @scrolltolower="() => fetchNextInteract()">
          <view v-if="!isLoggedIn()" class="min-h-full flex flex-col items-center justify-center -mt-6">
            <wd-empty icon="no-result" tip="登录后查看互动消息" />
            <wd-button size="small" round type="warning" custom-class="!mt-4 !font-bold shadow-md" @click="loginDirectly">
              去登录
            </wd-button>
          </view>
          <view v-else class="bottom-space--bar px-3 pt-2.5 space-y-4">
            <view v-if="interactLoading && isFetchingInteract" class="space-y-3">
              <wd-skeleton animation="gradient" :row-col="[{ width: '100%', height: '70px' }, { width: '100%', height: '70px' }]" />
            </view>
            <view v-else-if="interactions.length" class="space-y-4">
              <view
                v-for="group in groupedInteractions"
                :key="group.title"
                class="space-y-1.5"
              >
                <!-- 时间分组小标题 (本周 / 本月 / 更早) -->
                <text class="block px-1 text-xs text-[#8c5f38] font-black tracking-widest uppercase font-numeric">
                  {{ group.title }}
                </text>

                <view class="border-y border-[#B69171]">
                  <view
                    v-for="(item, index) in group.list"
                    :key="item.id"
                    class="flex cursor-pointer items-center justify-between py-3.5 transition-colors active:opacity-70"
                    :class="[{ 'border-t border-[#B69171]': index > 0 }, !item.isRead ? 'bg-[#F9DF95]/20 -mx-3 px-3' : '']"
                    @tap="handleInteractionTap(item)"
                  >
                    <view class="min-w-0 flex flex-1 items-center gap-3">
                      <view class="relative flex-shrink-0">
                        <wd-img
                          custom-class="h-11 w-11 block rounded-full bg-slate-100 object-cover ring-1 ring-[#B69171]"
                          :src="item.user.avatar || '/static/images/default-avatar.png'"
                          lazy-load
                          mode="aspectFill"
                          round
                          width="88rpx"
                          height="88rpx"
                        />
                        <!-- 未读红点：挂在头像右上角 (精致小巧无白色边框) -->
                        <view
                          v-if="!item.isRead"
                          class="absolute right-0 top-0 z-1 h-2 w-2 rounded-full bg-rose-500"
                        />
                      </view>

                      <view class="min-w-0 flex-1 space-y-1">
                        <!-- 第一行：用户名 (靠左) + 时间 (靠右) -->
                        <view class="flex items-center justify-between gap-2">
                          <view class="min-w-0 flex flex-1 items-center">
                            <text class="truncate text-sm text-[#1E1E1E] font-black tracking-tight">
                              {{ item.user.nickname }}
                            </text>
                            <text v-if="isMe(item.user.id)" class="ml-1 flex-shrink-0 rounded bg-[#B69171]/15 px-1 py-0.2 text-[10px] text-[#B69171] font-bold leading-none">我</text>
                          </view>
                          <text class="flex-shrink-0 text-xs text-[#756C5E] font-bold font-numeric">
                            {{ formatRelativeTime(item.rawCreatedAt || item.createdAt, { showTime: false }) }}
                          </text>
                        </view>

                        <!-- 第二行：文字描述内容 (增加 break-all 允许自然断字填满行尾) -->
                        <text class="line-clamp-2 block break-all text-sm text-[#756C5E] font-medium leading-relaxed">
                          {{ item.content }}
                        </text>
                      </view>
                    </view>
                  </view>
                </view>
              </view>
            </view>
            <view v-else class="py-20">
              <wd-empty icon="no-result" tip="暂无互动消息" />
            </view>

            <wd-loadmore
              v-if="isFetchingInteract"
              :state="isFetchingInteract ? 'loading' : undefined"
              @reload="fetchNextInteract"
            />
          </view>
        </scroll-view>
      </swiper-item>
    </swiper>
  </view>
</template>
