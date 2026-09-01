<script setup lang="ts">
import ListStateView from '@/components/list-state-view/list-state-view.vue'
import { useContent } from '@/features/content/query'

definePage({
  style: {
    navigationBarTitleText: '%page.help%',
  },
})

const { data, isLoading } = useContent('help')
</script>

<template>
  <view class="page-help safe-bottom-page bg-tx-main px-4 pb-6 pt-2">
    <ListStateView
      :loading="isLoading"
      :empty="!data?.content"
      empty-tip="暂无帮助文档"
      loading-variant="spinner"
    >
      <!-- 动态帮助文档（纯靠后端 contents/help 内容位配置，不含前端硬编码写死文案） -->
      <view v-if="data?.content" class="border-y border-tx-brown px-1 pb-3 pt-2">
        <rich-text :nodes="data.content" class="block break-words" />
      </view>
    </ListStateView>
  </view>
</template>
