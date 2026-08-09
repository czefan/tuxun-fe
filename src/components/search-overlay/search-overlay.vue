<script setup lang="ts">
import { getSearchHistoryKey } from '@/constants/storage'
import { computed, ref, watch } from 'vue'

type SearchScope = 'home' | 'history' | 'notice' | 'activity' | 'mall' | 'answers'

interface SearchResult {
  id: string
  title: string
  desc: string
  meta: string
}

const props = withDefaults(
  defineProps<{
    visible: boolean
    scope?: SearchScope
    title?: string
    searchKeyword?: string
    results?: SearchResult[]
  }>(),
  {
    scope: 'home',
    searchKeyword: '',
  },
)

const emit = defineEmits<{
  (event: 'update:visible', value: boolean): void
  (event: 'search', keyword: string): void
}>()

const historyList = ref<string[]>([])

const visibleResults = computed(() =>
  filterSearchResults(props.results ?? [], props.searchKeyword ?? ''),
)

watch(
  () => props.visible,
  (nextVisible) => {
    if (nextVisible) {
      historyList.value = getHistory()
    }
  },
)

function filterSearchResults(results: SearchResult[], value: string) {
  const normalizedValue = value.trim().toLowerCase()

  if (!normalizedValue) {
    return results.slice(0, 5)
  }

  return results.filter(item =>
    [item.title, item.desc, item.meta].some(text => text.toLowerCase().includes(normalizedValue)),
  )
}

function getStorageKey() {
  return getSearchHistoryKey(props.scope)
}

function getHistory() {
  const value = uni.getStorageSync(getStorageKey())
  return Array.isArray(value) ? value.slice(0, 8) : []
}

function saveHistory(nextHistory: string[]) {
  historyList.value = nextHistory
  uni.setStorageSync(getStorageKey(), nextHistory)
}

function useHistory(keyword: string) {
  const nextKeyword = keyword.trim()
  if (!nextKeyword)
    return
  saveHistory([nextKeyword, ...historyList.value.filter(item => item !== nextKeyword)].slice(0, 8))
  emit('search', nextKeyword)
  emit('update:visible', false)
}

function removeHistory(value: string) {
  saveHistory(historyList.value.filter(item => item !== value))
}

function clearHistory() {
  historyList.value = []
  uni.removeStorageSync(getStorageKey())
}
</script>

<template>
  <!-- 搜索栏正下方高级连体下拉面板 (High-end agency grade dropdown) -->
  <view
    v-if="visible"
    class="absolute inset-x-0 top-full z-40 overflow-hidden border border-t-0 border-[#D3BA9F]/70 rounded-b-[24px] bg-[#FFFDF9]/98 p-4 pt-6 shadow-2xl backdrop-blur-xl -mt-5 space-y-3.5"
  >
    <!-- 仅显示：搜索历史记录 -->
    <view v-if="!searchKeyword" class="space-y-2.5">
      <view class="flex items-center justify-between px-0.5">
        <view class="flex items-center gap-1.5">
          <text class="i-carbon:time text-xs text-[#B69171]" />
          <text class="text-xs text-[#1E1E1E] font-black tracking-wide">搜索历史记录</text>
        </view>
        <view
          v-if="historyList.length"
          class="flex cursor-pointer items-center gap-1 text-xs text-[#756C5E] font-extrabold transition-opacity active:opacity-60"
          @tap="clearHistory"
        >
          <text class="i-carbon:trash-can text-xs text-[#756C5E]" />
          <text>清空</text>
        </view>
      </view>

      <view v-if="historyList.length" class="flex flex-wrap gap-2 pt-0.5">
        <view
          v-for="item in historyList"
          :key="item"
          class="shadow-2xs inline-flex cursor-pointer items-center gap-1.5 border border-[#D3BA9F] rounded-full bg-[#F9DF95]/85 px-3 py-1 text-xs text-[#1E1E1E] font-bold transition-all active:scale-95 hover:bg-[#F9DF95]"
          @tap="useHistory(item)"
        >
          <text class="max-w-200rpx truncate">{{ item }}</text>
          <text
            class="i-carbon:close-small text-xs text-[#756C5E] transition-colors hover:text-[#1E1E1E]"
            @tap.stop="removeHistory(item)"
          />
        </view>
      </view>
      <view v-else class="py-3 text-center">
        <text class="text-xs text-[#756C5E] font-bold">暂无历史记录</text>
      </view>
    </view>

    <!-- 仅显示：搜索推荐相关词 -->
    <view v-else class="space-y-1">
      <text class="block px-0.5 text-xs text-[#1E1E1E] font-black tracking-wide">搜索推荐相关词</text>
      <view class="pt-1 divide-y divide-[#D3BA9F]/20">
        <view
          v-for="item in visibleResults"
          :key="item.id"
          class="flex cursor-pointer items-center justify-between rounded-xl px-2.5 py-2.5 transition-all active:bg-[#B69171]/10"
          @tap="useHistory(item.title)"
        >
          <view class="min-w-0 flex flex-1 items-center gap-2.5">
            <view class="h-6 w-6 flex items-center justify-center rounded-full bg-[#B69171]/15 text-[#B69171]">
              <text class="i-carbon:search text-xs font-bold" />
            </view>
            <text class="truncate text-xs text-[#1E1E1E] font-black">{{ item.title }}</text>
          </view>
          <text class="text-[11px] text-[#B69171] font-black">{{ item.meta }}</text>
        </view>
      </view>
      <view v-if="!visibleResults.length" class="py-4 text-center">
        <text class="text-xs text-[#756C5E] font-bold">暂无相关推荐词</text>
      </view>
    </view>
  </view>
</template>
