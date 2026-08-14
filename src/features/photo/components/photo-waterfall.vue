<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import PhotoCard from './photo-card.vue'
import type { PhotoCardVM } from '../types'

const props = withDefaults(
  defineProps<{
    list: PhotoCardVM[]
    loading?: boolean
    error?: boolean
    emptyText?: string
    /** 正在打开的卡片 id；只有它会带上 view-transition-name */
    openingId?: number | null
  }>(),
  {
    loading: false,
    error: false,
    emptyText: '暂无题目',
    openingId: null,
  },
)

const emit = defineEmits<{
  (event: 'open', item: PhotoCardVM): void
  (event: 'retry'): void
}>()

/**
 * 渐进式分批渲染。
 *
 * 不是虚拟滚动：瀑布流卡片高度由图片比例决定、事先未知，
 * 真正的虚拟化需要先测量再定位，成本远高于收益。这里只解决
 * 「翻了很多页后一次性挂载大量节点」的问题——首屏先渲染一批，
 * 其余在空闲时逐批补齐，**绝不截断数据**。
 */
const BATCH_SIZE = 20
const visibleCount = ref(BATCH_SIZE)
let timer: ReturnType<typeof setTimeout> | null = null

function scheduleNextBatch() {
  if (timer) {
    return
  }
  if (visibleCount.value >= props.list.length) {
    return
  }
  timer = setTimeout(() => {
    timer = null
    visibleCount.value = Math.min(visibleCount.value + BATCH_SIZE, props.list.length)
    scheduleNextBatch()
  }, 16)
}

watch(
  () => props.list,
  (list) => {
    const length = list?.length ?? 0
    // 只在列表变短时收窄（切换排序/搜索会整体替换）。
    // 变长时绝不能重置成第一批——否则已渲染的内容会先塌回 20 条再重新长出来。
    // 分页上拉加载追加数据时，保持渐进渲染且不跳动。
    if (visibleCount.value > length) {
      visibleCount.value = Math.min(BATCH_SIZE, length)
    }
    scheduleNextBatch()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
})

const renderList = computed(() => props.list.slice(0, visibleCount.value))

// 按累计高度进行贪心双列分列，使左右两列高度保持对齐
const splitColumns = computed(() => {
  const left: PhotoCardVM[] = []
  const right: PhotoCardVM[] = []
  let leftHeight = 0
  let rightHeight = 0

  renderList.value.forEach((item) => {
    // 基础比率 = 高 / 宽
    const w = item.image?.width || 800
    const h = item.image?.height || 600
    const ratio = w > 0 ? h / w : 0.75
    // 卡片在瀑布流中的预估相对高度（包含图片比例 + 底部文字区域固定偏置）
    const itemEstimateHeight = ratio + 0.35

    if (leftHeight <= rightHeight) {
      left.push(item)
      leftHeight += itemEstimateHeight
    }
    else {
      right.push(item)
      rightHeight += itemEstimateHeight
    }
  })

  return { left, right }
})
</script>

<template>
  <view class="photo-waterfall">
    <view v-if="list.length > 0" class="photo-waterfall__grid">
      <view class="photo-waterfall__col">
        <PhotoCard
          v-for="item in splitColumns.left"
          :key="item.id"
          :item="item"
          :opening="item.id === props.openingId"
          @open="emit('open', $event)"
        />
      </view>
      <view class="photo-waterfall__col">
        <PhotoCard
          v-for="item in splitColumns.right"
          :key="item.id"
          :item="item"
          :opening="item.id === props.openingId"
          @open="emit('open', $event)"
        />
      </view>
    </view>

    <!-- 首屏加载骨架屏 -->
    <view v-else-if="loading" class="photo-waterfall__grid">
      <view class="photo-waterfall__col space-y-3">
        <wd-skeleton animation="gradient" :row-col="[{ width: '100%', height: '220px' }, { width: '100%', height: '180px' }]" />
      </view>
      <view class="photo-waterfall__col space-y-3">
        <wd-skeleton animation="gradient" :row-col="[{ width: '100%', height: '180px' }, { width: '100%', height: '220px' }]" />
      </view>
    </view>

    <!-- 失败态视图 -->
    <view v-else-if="error" class="min-h-[50vh] flex flex-col items-center justify-center gap-3 py-12">
      <wd-empty icon="network-error" tip="加载失败，请检查网络后重试" />
      <wd-button size="small" plain round @click="emit('retry')">
        重新加载
      </wd-button>
    </view>

    <!-- 空态视图 -->
    <view v-else class="min-h-[50vh] flex flex-col items-center justify-center py-12">
      <wd-empty icon="no-result" :tip="emptyText" />
    </view>
  </view>
</template>

<style lang="scss">
.photo-waterfall {
  @apply box-border w-full py-1;

  &__grid {
    @apply flex gap-1.5 align-start;
  }

  &__col {
    @apply flex-1 flex flex-col min-w-0;
  }
}
</style>
