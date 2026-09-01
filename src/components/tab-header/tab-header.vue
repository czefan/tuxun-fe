<script setup lang="ts" generic="T extends string">
defineOptions({
  options: {
    virtualHost: true,
  },
})

defineProps<{
  modelValue: T
  options: readonly T[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: T): void
  (e: 'tab-click', value: T): void
}>()

function handleTabTap(opt: T) {
  emit('update:modelValue', opt)
  emit('tab-click', opt)
}
</script>

<template>
  <view class="flex flex-shrink-0 items-end justify-between px-1 pb-0 u-divider-b">
    <view class="flex flex-shrink-0 items-center gap-6">
      <view
        v-for="opt in options"
        :key="opt"
        class="relative cursor-pointer pb-2.5 transition-all active:scale-95"
        :class="modelValue === opt ? 'u-tab-active' : 'u-tab-inactive'"
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

    <!-- 右侧操作区：锁定 min-h-7 高度，防止有无操作按钮导致顶栏上下跳动 -->
    <view v-if="$slots.actions" class="min-h-7 flex flex-shrink-0 items-center gap-2.5 pb-2.5">
      <slot name="actions" :active="modelValue" />
    </view>
  </view>
</template>
