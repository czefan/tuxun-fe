<script setup lang="ts" generic="T extends string">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: T
  options: readonly T[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: T): void
}>()

const currentTabIndex = computed(() => props.options.indexOf(props.modelValue))
</script>

<template>
  <view class="h-full w-full flex flex-1 flex-col overflow-hidden">
    <!-- 融入页面的顶栏 Seamless Sub Tab 切换器 -->
    <view
      class="flex flex-shrink-0 items-center gap-6 px-1 pb-0"
      style="border-bottom: 1px solid rgba(211, 186, 159, 0.5)"
    >
      <view
        v-for="opt in options"
        :key="opt"
        class="relative cursor-pointer pb-2.5 text-base transition-all active:scale-95"
        :class="modelValue === opt ? 'text-tx-ink font-black' : 'text-tx-ink-3 font-bold'"
        @tap="emit('update:modelValue', opt)"
      >
        <text>{{ opt }}</text>
        <view
          v-if="modelValue === opt"
          class="absolute left-0 right-0 h-[2.5px] rounded-full bg-tx-brown -bottom-[1px]"
        />
      </view>
    </view>

    <!-- 支持左右平滑连贯拖拽滑屏的 Swiper 容器 -->
    <swiper
      class="box-border min-h-0 w-[calc(100%+24px)] flex-1 -mx-3"
      :current="currentTabIndex"
      :duration="300"
      @change="(e) => emit('update:modelValue', options[e.detail.current])"
    >
      <swiper-item v-for="opt in options" :key="opt" class="box-border">
        <slot name="panel" :option="opt" :active="modelValue === opt" />
      </swiper-item>
    </swiper>
  </view>
</template>
