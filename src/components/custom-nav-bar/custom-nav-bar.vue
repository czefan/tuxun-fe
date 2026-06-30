<template>
  <view
    class="custom-nav-bar"
    :class="{ 'custom-nav-bar--fixed': fixed, 'custom-nav-bar--sticky': !fixed }"
    :style="navStyle"
  >
    <view class="custom-nav-bar__left" :style="sideWidthStyle">
      <view v-if="showBack" class="custom-nav-bar__back" @tap="handleBack">
        <view class="custom-nav-bar__back-arrow" :style="{ borderColor: backColor }" />
      </view>
      <slot name="left" />
    </view>
    <text class="custom-nav-bar__title">{{ title }}</text>
    <view class="custom-nav-bar__right" :style="sideWidthStyle">
      <slot name="right" />
    </view>
  </view>
  <!-- 占位元素 -->
  <view v-if="placeholder" class="custom-nav-bar-placeholder" :style="placeholderStyle" />
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

<style lang="scss">
@import '@/styles/_mixins.scss';
.custom-nav-bar {
  right: 0;
  left: 0;
  z-index: 120;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0; /* 完全由两侧及内部元素控制边距 */
  background: #ffffff;
  box-sizing: content-box;
}

.custom-nav-bar--fixed {
  position: fixed;
  top: 0;
}

.custom-nav-bar--sticky {
  position: sticky;
  top: 0;
}

.custom-nav-bar__left,
.custom-nav-bar__right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  min-height: 44px;
  box-sizing: border-box;
}

.custom-nav-bar__left {
  justify-content: flex-start;
}

.custom-nav-bar__right {
  justify-content: flex-end;
}

.custom-nav-bar__back {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-left: 16px; /* 完美复刻微信 H5 和微信小程序原生的 16px 左边距 */
  width: 44px;
  height: 44px;
  box-sizing: border-box;
}

.custom-nav-bar__back-arrow {
  @include nav-back-arrow;
}

.custom-nav-bar__title {
  display: block;
  overflow: hidden;
  flex: 1;
  padding: 0 4px;
  font-size: 16px;
  font-weight: 700;
  line-height: 44px;
  color: #1f1b14;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.custom-nav-bar-placeholder {
  flex-shrink: 0;
}
</style>
