<script setup lang="ts">
import { computed } from 'vue'
import type { AnnouncementVM } from '../types'
import { groupItemsByTime } from '../time-group'
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

function isAnnouncementRead(id: number): boolean {
  return props.readIds.includes(id)
}
</script>

<template>
  <scroll-view scroll-y :show-scrollbar="false" class="hide-scrollbar box-border h-full w-full" @scrolltolower="() => emit('loadMore')">
    <view v-if="!isLoggedIn" class="min-h-full flex flex-col items-center justify-center -mt-6">
      <wd-empty icon="no-result" tip="登录后查看系统通知" />
      <wd-button size="small" round type="warning" custom-class="!mt-4 !font-bold shadow-md" @click="emit('login')">
        去登录
      </wd-button>
    </view>
    <view v-else class="bottom-space--bar px-3 pt-2.5 space-y-4">
      <view v-if="loading" class="space-y-3">
        <wd-skeleton animation="gradient" :row-col="[{ width: '100%', height: '80px' }, { width: '100%', height: '80px' }]" />
      </view>
      <view v-else-if="error" class="flex flex-col items-center justify-center gap-3 py-20">
        <wd-empty icon="network-error" tip="加载失败，请检查网络后重试" />
        <wd-button size="small" plain round @click="emit('reload')">
          重新加载
        </wd-button>
      </view>
      <view v-else-if="items.length" class="space-y-4">
        <view
          v-for="group in groupedAnnouncements"
          :key="group.title"
          class="space-y-1.5"
        >
          <!-- 时间分组小标题 (本周 / 本月 / 更早) -->
          <text class="block px-1 text-xs text-[#8c5f38] font-black tracking-widest uppercase font-numeric">
            {{ group.title }}
          </text>

          <view class="border-y border-tx-brown">
            <view
              v-for="(item, index) in group.list"
              :key="item.id"
              class="cursor-pointer py-3.5 transition-colors space-y-1 active:opacity-70"
              :class="[
                { 'border-t border-tx-brown': index > 0 },
                !isAnnouncementRead(item.id) ? 'bg-tx-accent/15 -mx-3 px-3' : '',
              ]"
              @tap="emit('select', item.id)"
            >
              <!-- 顶栏：标题 + 未读红点 + 格式化时间 -->
              <view class="flex items-baseline justify-between gap-3">
                <view class="min-w-0 flex flex-1 items-center gap-1.5">
                  <view v-if="!isAnnouncementRead(item.id)" class="h-2 w-2 flex-shrink-0 rounded-full bg-rose-500" />
                  <text
                    class="truncate text-base tracking-tight"
                    :class="!isAnnouncementRead(item.id) ? 'text-tx-ink font-black' : 'text-[#333333] font-bold'"
                  >
                    {{ item.title }}
                  </text>
                </view>
                <text class="flex-shrink-0 text-sm text-tx-ink-2 font-bold font-numeric">
                  {{ formatRelativeTime(item.rawCreatedAt || item.createdAt, { showTime: false }) }}
                </text>
              </view>

              <!-- 内容预览 -->
              <text class="line-clamp-2 block text-sm leading-relaxed" :class="!isAnnouncementRead(item.id) ? 'text-[#333333]' : 'text-tx-ink-2'">
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
        v-if="isFetchingNextPage"
        :state="isFetchingNextPage ? 'loading' : undefined"
        @reload="emit('loadMore')"
      />
    </view>
  </scroll-view>
</template>
