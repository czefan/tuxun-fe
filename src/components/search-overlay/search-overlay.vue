<template>
  <view v-if="visible" class="fixed inset-x-0 bottom-0 z-[1200] overflow-hidden" :style="overlayStyle">
    <view class="absolute inset-0 bg-[#1f1b14]/48" @tap="closeSearch" />
    <view class="relative box-border max-h-full w-full overflow-y-auto rounded-0 p-[24rpx_24rpx_calc(34rpx+env(safe-area-inset-bottom))] shadow-[0_24rpx_80rpx_rgba(0,0,0,0.22)]" :style="panelStyle">
      <view class="flex items-center gap-16rpx pb-30rpx">
        <wd-search
          v-model="keyword"
          :placeholder="placeholder"
          hide-cancel
          custom-class="tx-search"
          placeholder-left
          :focus="visible"
          @search="submitSearch"
        />
        <view class="h-64rpx w-64rpx flex flex-shrink-0 cursor-pointer items-center justify-center border border-[rgba(31,27,20,0.08)] rounded-full border-solid bg-white" @tap="closeSearch">
          <wd-icon name="close" color="#1f1b14" size="28rpx" />
        </view>
      </view>

      <view v-if="!keyword" class="mb-34rpx">
        <view class="flex items-center justify-between gap-20rpx">
          <text class="block text-30rpx text-[#1f1b14] font-900">{{ t('common.searchHistory') }}</text>
          <text v-if="historyList.length" class="block flex-shrink-0 cursor-pointer text-24rpx text-[#9f927f]" @tap="clearHistory">
            {{ t('common.clearSearchHistory') }}
          </text>
        </view>
        <view v-if="historyList.length" class="mt-20rpx flex flex-wrap gap-16rpx">
          <view
            v-for="item in historyList"
            :key="item"
            class="box-border max-w-full flex cursor-pointer items-center gap-18rpx border border-[rgba(31,27,20,0.08)] rounded-full border-solid bg-white p-[12rpx_16rpx_12rpx_22rpx]"
            @tap="useHistory(item)"
          >
            <text class="block truncate text-24rpx text-[#1f1b14] font-700">{{ item }}</text>
            <view class="h-30rpx w-30rpx flex flex-shrink-0 items-center justify-center" @tap.stop="removeHistory(item)">
              <wd-icon name="close" color="#9f927f" size="20rpx" />
            </view>
          </view>
        </view>
        <wd-empty v-else :tip="t('common.noSearchHistory')" custom-style="padding-bottom: 0;" icon-size="120rpx" />
      </view>

      <view v-else-if="keyword" class="flex flex-col gap-18rpx">
        <text class="block text-30rpx text-[#1f1b14] font-900">{{ titleText }}</text>
        <view v-for="item in visibleResults" :key="item.id" class="border border-[rgba(31,27,20,0.06)] rounded-24rpx border-solid bg-white p-24rpx shadow-[0_10rpx_28rpx_rgba(31,26,18,0.06)]">
          <text class="block text-30rpx text-[#1f1b14] font-900">{{ item.title }}</text>
          <text class="mt-10rpx block text-26rpx text-[#756c5e] leading-1.45">{{ item.desc }}</text>
          <text class="mt-12rpx block text-24rpx text-[#b98200] font-800">{{ item.meta }}</text>
        </view>
        <wd-empty v-if="!visibleResults.length" :tip="t('common.noSearchResults')" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  filterSearchResults,
  getSearchPlaceholder,
  getSearchResults,
} from './features'
import type { SearchResult, SearchScope } from './features'
import { t } from '@/locale'

const props = withDefaults(
  defineProps<{
    visible: boolean
    scope?: SearchScope
    title?: string
    offsetTop?: string
    results?: SearchResult[]
  }>(),
  {
    scope: 'home',
    offsetTop: 'var(--window-top, 0px)',
  },
)

const emit = defineEmits<{
  (event: 'update:visible', value: boolean): void
  (event: 'search', keyword: string): void
}>()

const keyword = ref('')
const historyList = ref<string[]>([])

const overlayStyle = computed(() => ({
  top: props.offsetTop,
}))

const panelStyle = computed(() => ({
  background: 'radial-gradient(circle at 12% 0%, rgba(245, 197, 66, 0.22), transparent 34%), linear-gradient(180deg, #fffaf0 0%, #f5f5f5 360rpx)',
}))

const placeholder = computed(() => getSearchPlaceholder(props.scope))
const titleText = computed(() => props.title || t('common.search'))
const visibleResults = computed(() =>
  props.results
    ? filterSearchResults(props.results, keyword.value)
    : getSearchResults(props.scope, keyword.value),
)

watch(
  () => props.visible,
  (nextVisible) => {
    if (nextVisible) {
      keyword.value = ''
      historyList.value = getHistory()
    }
  },
)

watch(
  () => props.scope,
  () => {
    if (props.visible) {
      historyList.value = getHistory()
    }
  },
)

function getStorageKey() {
  return `searchHistory:${props.scope}`
}

function getHistory() {
  const value = uni.getStorageSync(getStorageKey())
  return Array.isArray(value) ? value.slice(0, 8) : []
}

function saveHistory(nextHistory: string[]) {
  historyList.value = nextHistory
  uni.setStorageSync(getStorageKey(), nextHistory)
}

function submitSearch(value?: string | number | { value?: string | number }) {
  const rawValue = typeof value === 'object' && value !== null ? value.value : value
  const nextKeyword = String(rawValue ?? keyword.value).trim()

  if (!nextKeyword) {
    return
  }

  keyword.value = nextKeyword
  saveHistory([nextKeyword, ...historyList.value.filter(item => item !== nextKeyword)].slice(0, 8))
  emit('search', nextKeyword)
  closeSearch()
}

function useHistory(value: string) {
  keyword.value = value
  submitSearch(value)
}

function removeHistory(value: string) {
  saveHistory(historyList.value.filter(item => item !== value))
}

function clearHistory() {
  historyList.value = []
  uni.removeStorageSync(getStorageKey())
}

function closeSearch() {
  emit('update:visible', false)
}
</script>
