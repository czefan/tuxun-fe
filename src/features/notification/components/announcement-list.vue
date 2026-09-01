<script setup lang="ts">
import { computed } from 'vue'
import type { AnnouncementVM } from '../types'
import { groupItemsByTime } from '../time-group'
import { formatRelativeTime } from '@/utils/date'
import { TX_BG_BROWN } from '@/styles/constants'

const props = defineProps<{
  items: AnnouncementVM[]
  loading?: boolean
  error?: boolean
  isFetchingNextPage?: boolean
  isLoggedIn: boolean
  readIds: number[]
}>()

const emit = defineEmits<{
  (e: 'login'): void
  (e: 'reload'): void
  (e: 'loadMore'): void
  (e: 'select', id: number): void
}>()

const groupedAnnouncements = computed(() => groupItemsByTime(props.items))

function isAnnouncementRead(item: AnnouncementVM): boolean {
  return item.isRead || props.readIds.includes(item.id)
}
</script>

<template>
  <scroll-view
    scroll-y
    :show-scrollbar="false"
    class="hide-scrollbar box-border h-full w-full"
    @scrolltolower="() => emit('loadMore')"
  >
    <view
      v-if="!isLoggedIn"
      class="h-full min-h-[65vh] flex flex-col items-center justify-center -mt-8"
    >
      <wd-empty icon="no-result" tip="登录后查看系统通知" />
      <wd-button
        size="small"
        round
        type="warning"
        custom-class="!mt-4 !font-bold shadow-md"
        @click="emit('login')"
      >
        去登录
      </wd-button>
    </view>

    <!-- 1. 加载态：全屏光学垂直居中 -->
    <view
      v-else-if="loading"
      class="h-full min-h-[65vh] flex flex-col items-center justify-center -mt-8"
    >
      <wd-loading type="circular" :color="TX_BG_BROWN" size="36px" />
    </view>

    <!-- 2. 失败态：全屏光学垂直居中 -->
    <view
      v-else-if="error"
      class="h-full min-h-[65vh] flex flex-col items-center justify-center gap-3 -mt-8"
    >
      <wd-empty icon="network-error" tip="加载失败，请检查网络后重试" />
      <wd-button size="small" plain round @click="emit('reload')"> 重新加载 </wd-button>
    </view>

    <!-- 3. 正常列表 -->
    <view v-else-if="items.length" class="bottom-space--bar px-3 pt-2.5 space-y-4">
      <view v-for="group in groupedAnnouncements" :key="group.title" class="space-y-1.5">
        <!-- 时间分组小标题 (本周 / 本月 / 更早) -->
        <text
          class="block px-1 text-xs text-[#8c5f38] font-black tracking-widest uppercase font-numeric"
        >
          {{ group.title }}
        </text>

        <view class="border-y border-tx-brown">
          <view
            v-for="(item, index) in group.list"
            :key="item.id"
            class="flex cursor-pointer items-center justify-between py-3.5 transition-colors active:opacity-70"
            :class="[
              { 'border-t border-tx-brown': index > 0 },
              !isAnnouncementRead(item) ? 'bg-tx-accent/20 -mx-3 px-3' : '',
            ]"
            @tap="emit('select', item.id)"
          >
            <view class="min-w-0 flex flex-1 flex-col justify-between py-1">
              <!-- 顶栏：标题 + 未读红点 + 格式化时间 -->
              <view class="flex items-center justify-between gap-2">
                <view class="min-w-0 flex flex-1 items-center gap-1.5">
                  <!-- 未读红点：标题左侧 -->
                  <view
                    v-if="!isAnnouncementRead(item)"
                    class="h-2 w-2 flex-shrink-0 rounded-full bg-rose-500"
                  />
                  <text class="truncate text-base text-tx-ink font-bold leading-tight">
                    {{ item.title }}
                  </text>
                </view>
                <text class="flex-shrink-0 text-sm text-tx-ink-2 font-bold font-numeric">
                  {{ formatRelativeTime(item.rawCreatedAt || item.createdAt, { showTime: false }) }}
                </text>
              </view>

              <!-- 内容预览 -->
              <text
                class="line-clamp-2 mt-1 block text-sm leading-relaxed"
                :class="!isAnnouncementRead(item) ? 'text-[#333333]' : 'text-tx-ink-2'"
              >
                {{ item.contentPreview }}
              </text>
            </view>
          </view>
        </view>
      </view>

      <wd-loadmore
        v-if="isFetchingNextPage"
        :state="isFetchingNextPage ? 'loading' : undefined"
        @reload="emit('loadMore')"
      />
    </view>

    <!-- 4. 空态：全屏光学垂直居中 -->
    <view v-else class="h-full min-h-[65vh] flex flex-col items-center justify-center -mt-8">
      <wd-empty icon="no-result" tip="暂无系统通知" />
    </view>
  </scroll-view>
</template>
