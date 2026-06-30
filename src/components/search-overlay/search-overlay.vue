<template>
  <view v-if="visible" class="search-overlay" :style="overlayStyle">
    <view class="search-overlay__shade" @tap="closeSearch" />
    <view class="search-panel">
      <view class="search-header">
        <wd-search
          v-model="keyword"
          :placeholder="placeholder"
          hide-cancel
          custom-class="tx-search"
          placeholder-left
          :focus="visible"
          @search="submitSearch"
        />
        <view class="search-close" @tap="closeSearch">
          <wd-icon name="close" color="#1f1b14" size="28rpx" />
        </view>
      </view>

      <view v-if="!keyword" class="search-section">
        <view class="search-section__header">
          <text class="search-section__title">{{ t('common.searchHistory') }}</text>
          <text v-if="historyList.length" class="search-section__clear" @tap="clearHistory">
            {{ t('common.clearSearchHistory') }}
          </text>
        </view>
        <view v-if="historyList.length" class="history-tags">
          <view
            v-for="item in historyList"
            :key="item"
            class="history-tag"
            @tap="useHistory(item)"
          >
            <text class="history-tag__text">{{ item }}</text>
            <view class="history-tag__remove" @tap.stop="removeHistory(item)">
              <wd-icon name="close" color="#9f927f" size="20rpx" />
            </view>
          </view>
        </view>
        <wd-empty v-else :tip="t('common.noSearchHistory')" custom-style="padding-bottom: 0;" icon-size="120rpx" />
      </view>

      <view v-else-if="keyword" class="search-results">
        <text class="search-results__title">{{ titleText }}</text>
        <view v-for="item in visibleResults" :key="item.id" class="result-card">
          <text class="result-card__title">{{ item.title }}</text>
          <text class="result-card__desc">{{ item.desc }}</text>
          <text class="result-card__meta">{{ item.meta }}</text>
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

<style scoped lang="scss">
.search-overlay {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1200;
  overflow: hidden;
}

.search-overlay__shade {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(31, 27, 20, 0.48);
}

.search-panel {
  position: relative;
  max-height: 100%;
  width: 100%;
  padding: 24rpx 24rpx calc(34rpx + env(safe-area-inset-bottom));
  overflow-y: auto;
  background:
    radial-gradient(circle at 12% 0%, rgba(245, 197, 66, 0.22), transparent 34%),
    linear-gradient(180deg, #fffaf0 0%, #f5f5f5 360rpx);
  border-radius: 0;
  box-shadow: 0 24rpx 80rpx rgba(0, 0, 0, 0.22);
  box-sizing: border-box;
}

.search-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding-bottom: 30rpx;
}

.search-header :deep(.wd-search) {
  flex: 1;
  min-width: 0;
}

.search-close {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 64rpx;
  height: 64rpx;
  background: #ffffff;
  border: 1rpx solid rgba(31, 27, 20, 0.08);
  border-radius: 999rpx;
}

.search-section {
  margin-bottom: 34rpx;
}

.search-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.search-section__title,
.search-section__clear,
.history-tag__text,
.search-results__title,
.result-card__title,
.result-card__desc,
.result-card__meta {
  display: block;
}

.search-section__title,
.search-results__title {
  font-size: 30rpx;
  font-weight: 900;
  color: #1f1b14;
}

.search-section__clear {
  flex-shrink: 0;
  font-size: 24rpx;
  color: #9f927f;
}

.history-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 20rpx;
}

.history-tag {
  display: flex;
  align-items: center;
  gap: 18rpx;
  max-width: 100%;
  padding: 12rpx 16rpx 12rpx 22rpx;
  background: #ffffff;
  border: 1rpx solid rgba(31, 27, 20, 0.08);
  border-radius: 999rpx;
  box-sizing: border-box;
}

.history-tag__text {
  overflow: hidden;
  font-size: 24rpx;
  font-weight: 700;
  color: #1f1b14;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-tag__remove {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 30rpx;
  height: 30rpx;
}

.search-results {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.result-card {
  padding: 24rpx;
  background: #ffffff;
  border: 1rpx solid rgba(31, 27, 20, 0.06);
  border-radius: 24rpx;
  box-shadow: 0 10rpx 28rpx rgba(31, 26, 18, 0.06);
}

.result-card__title {
  font-size: 30rpx;
  font-weight: 900;
  color: #1f1b14;
}

.result-card__desc {
  margin-top: 10rpx;
  font-size: 26rpx;
  line-height: 1.45;
  color: #756c5e;
}

.result-card__meta {
  margin-top: 12rpx;
  font-size: 24rpx;
  font-weight: 800;
  color: #b98200;
}
</style>
