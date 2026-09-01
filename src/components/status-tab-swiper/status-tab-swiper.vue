<script setup lang="ts" generic="T extends string">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: T
    options: readonly T[]
    customClass?: string
    headerClass?: string
    tabListClass?: string
    actionsClass?: string
    swiperClass?: string
    duration?: number
  }>(),
  {
    customClass: '',
    headerClass: '',
    tabListClass: '',
    actionsClass: '',
    swiperClass: '',
    duration: 300,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: T): void
  (e: 'tab-click', value: T): void
  (e: 'change', value: T): void
}>()

const currentTabIndex = computed(() => {
  const idx = props.options.indexOf(props.modelValue)
  return idx >= 0 ? idx : 0
})

function handleTabTap(opt: T) {
  emit('update:modelValue', opt)
  emit('tab-click', opt)
}

function handleSwiperChange(opt?: T) {
  if (opt !== undefined && opt !== props.modelValue) {
    emit('update:modelValue', opt)
    emit('change', opt)
  }
}
</script>

<template>
  <view class="min-h-0 w-full flex flex-1 flex-col" :class="customClass">
    <!-- 融入页面的顶栏 Seamless Sub Tab 切换器 -->
    <view
      class="flex flex-shrink-0 items-end justify-between px-1 pb-0"
      :class="headerClass"
      style="border-bottom: 1px solid rgba(211, 186, 159, 0.5)"
    >
      <view class="flex items-center gap-6" :class="tabListClass">
        <view
          v-for="opt in options"
          :key="opt"
          class="relative cursor-pointer pb-2.5 text-base transition-all active:scale-95"
          :class="modelValue === opt ? 'text-tx-ink font-black' : 'text-tx-ink-3 font-bold'"
          @tap="handleTabTap(opt)"
        >
          <slot name="label" :option="opt" :active="modelValue === opt">
            <text>{{ opt }}</text>
          </slot>
          <view
            v-if="modelValue === opt"
            class="absolute left-0 right-0 h-[2.5px] rounded-full bg-tx-brown -bottom-[1px]"
          />
        </view>
      </view>

      <!-- 右侧操作区：min-h-7 锁定高度，杜绝不同 Tab 操作按钮有无导致顶栏上下跳动 -->
      <view
        v-if="$slots.actions"
        class="min-h-7 flex items-center gap-2.5 pb-2.5"
        :class="actionsClass"
      >
        <slot name="actions" :active="modelValue" />
      </view>
    </view>

    <!-- 顶栏下方扩展区（如搜索框展开区） -->
    <slot name="extra" />

    <!-- 支持左右平滑连贯拖拽滑屏的 Swiper 容器 -->
    <swiper
      class="box-border min-h-0 w-[calc(100%+24px)] flex-1 -mx-3"
      :class="swiperClass"
      :current="currentTabIndex"
      :duration="duration"
      @change="(e) => handleSwiperChange(options[e.detail.current])"
    >
      <swiper-item v-for="opt in options" :key="opt" class="box-border">
        <slot name="panel" :option="opt" :active="modelValue === opt" />
      </swiper-item>
    </swiper>
  </view>
</template>
