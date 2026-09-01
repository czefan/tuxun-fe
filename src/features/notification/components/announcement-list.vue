<script setup lang="ts">
import { computed } from 'vue'
import type { AnnouncementVM } from '../types'
import { groupItemsByTime } from '../time-group'
import ListStateView from '@/components/list-state-view/list-state-view.vue'
import { formatRelativeTime } from '@/utils/date'

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
    <ListStateView
      :needs-login="!isLoggedIn"
      :loading="loading"
      :error="error"
      :empty="!items.length"
      login-tip="登录后查看系统通知"
      empty-tip="暂无系统通知"
      loading-variant="spinner"
      @login="emit('login')"
      @retry="emit('reload')"
    >
      <!-- 正常列表 -->
      <view class="bottom-space--bar px-3 pt-2.5 space-y-4">
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
                    {{
                      formatRelativeTime(item.rawCreatedAt || item.createdAt, { showTime: false })
                    }}
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
    </ListStateView>
  </scroll-view>
</template>
