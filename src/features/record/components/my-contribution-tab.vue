<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import StatusTag from '@/components/status-tag/status-tag.vue'
import { useInfiniteMyPhotos } from '../query'
import type { UserPhotoVM } from '../types'
import ListStateView from '@/components/list-state-view/list-state-view.vue'
import { useAuth } from '@/composables/use-auth'
import { useInfiniteListPage } from '@/composables/use-infinite-list-page'

defineOptions({
  options: {
    virtualHost: true,
  },
})

const props = defineProps<{
  status?: 'pending' | 'approved' | 'rejected'
  active: boolean
}>()

const emit = defineEmits<{
  (e: 'openDetail', item: UserPhotoVM): void
  (e: 'login'): void
}>()

const { isLoggedIn } = useAuth()

// 懒加载：首次激活时才触发请求
const hasActivated = ref(props.active)
watch(
  () => props.active,
  (val) => {
    if (val) hasActivated.value = true
  },
)

const queryParams = computed(() => ({
  status: props.status,
  page_size: 20,
}))

const {
  isFetching,
  isStale,
  data: photosPagesData,
  isLoading,
  isError,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  refetch,
} = useInfiniteMyPhotos(queryParams, {
  enabled: computed(() => isLoggedIn() && hasActivated.value),
})

const list = computed<UserPhotoVM[]>(
  () => photosPagesData.value?.pages.flatMap((page) => page.list) ?? [],
)

// 绑定下拉刷新与触底加载（仅在当前 Tab 处于 active 时响应）
const { loadMore } = useInfiniteListPage({
  isFetching,
  isStale,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  refetch,
  enabled: () => props.active && isLoggedIn(),
})
</script>

<template>
  <scroll-view
    scroll-y
    :show-scrollbar="false"
    class="hide-scrollbar box-border h-full w-full"
    @scrolltolower="loadMore"
  >
    <ListStateView
      :needs-login="!isLoggedIn()"
      :loading="isLoading || !hasActivated"
      :error="isError && list.length === 0"
      :empty="list.length === 0"
      login-tip="登录后查看投稿记录"
      empty-tip="暂无投稿记录"
      loading-variant="spinner"
      @login="emit('login')"
      @retry="refetch"
    >
      <!-- 真实列表内容：完全忠实还原原始经典 UI 样式（棕色边框线列表） -->
      <view class="bottom-space px-3 pt-2.5 space-y-3">
        <view class="border-y border-tx-brown">
          <view
            v-for="(item, index) in list"
            :key="item.id"
            class="flex cursor-pointer items-center justify-between py-3.5 transition-colors active:opacity-75"
            :class="index > 0 ? 'border-t border-tx-brown' : ''"
            @tap="emit('openDetail', item)"
          >
            <view class="mr-2 h-16 min-w-0 flex flex-1 items-center gap-3">
              <wd-img
                custom-class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-tx-brown/10 object-cover ring-1 ring-tx-border"
                lazy-load
                :src="item.image.url"
                mode="aspectFill"
                width="64px"
                height="64px"
              />
              <view class="h-16 min-w-0 flex flex-1 flex-col justify-between py-1">
                <text class="line-clamp-2 block u-title-base font-bold">{{ item.title }}</text>
                <text class="block u-meta-time">{{ item.createdAt }}</text>
              </view>
            </view>
            <StatusTag :status="item.status" />
          </view>

          <wd-loadmore
            v-if="isFetchingNextPage"
            :state="isFetchingNextPage ? 'loading' : undefined"
            @reload="fetchNextPage"
          />
        </view>
      </view>
    </ListStateView>
  </scroll-view>
</template>
