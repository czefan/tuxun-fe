<script setup lang="ts">
import { computed } from 'vue'
import type { InteractionMessageVM } from '../types'
import { groupItemsByTime } from '../time-group'
import ListStateView from '@/components/list-state-view/list-state-view.vue'
import { useAuth } from '@/composables/use-auth'
import { formatRelativeTime } from '@/utils/date'

defineOptions({
  options: {
    virtualHost: true,
  },
})

const props = defineProps<{
  items: InteractionMessageVM[]
  loading?: boolean
  error?: boolean
  isFetchingNextPage?: boolean
  isLoggedIn: boolean
}>()

const emit = defineEmits<{
  (e: 'login'): void
  (e: 'reload'): void
  (e: 'loadMore'): void
  (e: 'select', item: InteractionMessageVM): void
}>()

const { isMe } = useAuth()

const groupedInteractions = computed(() => groupItemsByTime(props.items))
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
      login-tip="登录后查看互动消息"
      empty-tip="暂无互动消息"
      loading-variant="spinner"
      @login="emit('login')"
      @retry="emit('reload')"
    >
      <!-- 正常列表 -->
      <view class="bottom-space--bar px-3 pt-2.5 space-y-4">
        <view v-for="group in groupedInteractions" :key="group.title" class="space-y-1.5">
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
                !item.isRead ? 'bg-tx-accent/20 -mx-3 px-3' : '',
              ]"
              @tap="emit('select', item)"
            >
              <view class="min-w-0 flex flex-1 items-center gap-3">
                <view class="relative flex-shrink-0">
                  <wd-img
                    custom-class="h-11 w-11 block rounded-full bg-slate-100 object-cover ring-1 ring-tx-brown"
                    :src="item.user.avatar || '/static/images/default-avatar.png'"
                    lazy-load
                    mode="aspectFill"
                    round
                    width="88rpx"
                    height="88rpx"
                  />
                  <!-- 未读红点：贴合头像右上圆周 (东北 45° 边界) -->
                  <view
                    v-if="!item.isRead"
                    class="absolute right-[2rpx] top-[2rpx] z-1 h-2 w-2 rounded-full bg-rose-500"
                  />
                </view>

                <view class="min-w-0 flex-1 space-y-1">
                  <!-- 第一行：用户名 (靠左) + 时间 (靠右) -->
                  <view class="flex items-center justify-between gap-2">
                    <view class="min-w-0 flex flex-1 items-center">
                      <text class="truncate text-sm text-tx-ink font-black tracking-tight">
                        {{ item.user.nickname }}
                      </text>
                      <text
                        v-if="isMe(item.user.id)"
                        class="ml-1 flex-shrink-0 rounded bg-tx-brown/15 px-1 py-0.2 text-[10px] text-tx-brown font-bold leading-none"
                      >
                        我
                      </text>
                    </view>
                    <text class="flex-shrink-0 text-xs text-tx-ink-2 font-bold font-numeric">
                      {{
                        formatRelativeTime(item.rawCreatedAt || item.createdAt, { showTime: false })
                      }}
                    </text>
                  </view>

                  <!-- 第二行：文字描述内容 -->
                  <text
                    class="line-clamp-2 block break-all text-sm text-tx-ink-2 font-medium leading-relaxed"
                  >
                    {{ item.content }}
                  </text>
                </view>
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
