<template>
  <view
    class="left-0 right-0 z-120 box-content flex items-center justify-between bg-white p-0"
    :class="[fixed ? 'fixed top-0' : 'sticky top-0']"
    :style="navStyle"
  >
    <view class="box-border min-h-44px flex flex-shrink-0 items-center justify-start" :style="sideWidthStyle">
      <view v-if="showBack" class="box-border h-44px w-44px flex cursor-pointer items-center justify-start pl-16px" @tap="handleBack">
        <view class="mt-1px box-border h-12px w-12px rotate-[-45deg] border-l-[1.5px] border-t-[1.5px] border-l-solid border-t-solid" :style="{ borderColor: backColor }" />
      </view>
      <slot name="left" />
    </view>
    <text class="block flex-1 overflow-hidden truncate px-4px text-center text-16px text-[#1f1b14] font-700 leading-44px">{{ title }}</text>
    <view class="box-border min-h-44px flex flex-shrink-0 items-center justify-end" :style="sideWidthStyle">
      <slot name="right" />
    </view>
  </view>
  <!-- 占位元素 -->
  <view v-if="placeholder" class="flex-shrink-0" :style="placeholderStyle" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSystemInfo } from '@/composables/useSystemInfo'

interface Props {
  title: string
  showBack?: boolean
  backColor?: string
  customBack?: boolean
  placeholder?: boolean
  fixed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showBack: true,
  backColor: 'rgba(31, 27, 20, 0.95)',
  customBack: false,
  placeholder: false,
  fixed: true,
})

const emit = defineEmits<{
  (e: 'back'): void
}>()

const { statusBarHeight, navBarContentHeight, navBarHeight, mpNavBarRightSpace } = useSystemInfo()

const navStyle = computed(() => ({
  paddingTop: `${statusBarHeight.value}px`,
  height: `${navBarContentHeight}px`,
}))

const placeholderStyle = computed(() => ({
  height: `${navBarHeight.value}px`,
}))

// 动态左右占位，小程序下使用胶囊区域，H5 下使用原生 44px
const sideWidthStyle = computed(() => {
  const width = mpNavBarRightSpace.value > 0 ? `${mpNavBarRightSpace.value}px` : '44px'
  return {
    width,
  }
})

function handleBack() {
  if (props.customBack) {
    emit('back')
  }
  else {
    uni.navigateBack()
  }
}
</script>
