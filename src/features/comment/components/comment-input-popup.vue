<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    visible: boolean
    modelValue: string
    loading?: boolean
    maxLength?: number
    placeholder?: string
  }>(),
  {
    loading: false,
    maxLength: 200,
    placeholder: '写下你的想法...',
  },
)

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'update:modelValue', value: string): void
  (e: 'submit'): void
}>()

const DEFAULT_EMOJIS = ['😂', '🤔', '🌹', '👍', '🤙', '👏', '😁', '🔥', '🎉', '🤣', '😭', '😍', '👀', '💯', '🙏', '😎', '🥳', '💪']
const STORAGE_KEY = 'comment_recent_emojis'

const emojiList = ref<string[]>([...DEFAULT_EMOJIS])
const isFocus = ref(false)
const keyboardHeight = ref(0)

function syncEmojis(next?: string[]) {
  try {
    if (next) {
      uni.setStorageSync(STORAGE_KEY, next)
      emojiList.value = next
    }
    else {
      const saved = uni.getStorageSync(STORAGE_KEY)
      if (Array.isArray(saved) && saved.length) {
        emojiList.value = Array.from(new Set([...saved, ...DEFAULT_EMOJIS])).slice(0, DEFAULT_EMOJIS.length)
      }
    }
  }
  catch {}
}

syncEmojis()

watch(
  () => props.visible,
  (val) => {
    // #ifdef H5
    if (typeof document !== 'undefined')
      document.body.style.overflow = val ? 'hidden' : ''
    // #endif

    if (val) {
      syncEmojis()
      setTimeout(() => {
        nextTick(() => {
          isFocus.value = true
        })
      }, 80)
    }
    else {
      isFocus.value = false
      keyboardHeight.value = 0
    }
  },
)

onUnmounted(() => {
  // #ifdef H5
  if (typeof document !== 'undefined')
    document.body.style.overflow = ''
  // #endif
})

function handleInsertEmoji(emoji: string) {
  if (props.modelValue.length + emoji.length > props.maxLength)
    return
  emit('update:modelValue', props.modelValue + emoji)
  isFocus.value = true
  syncEmojis([emoji, ...emojiList.value.filter(item => item !== emoji)])
}

function handleClose() {
  isFocus.value = false
  keyboardHeight.value = 0
  emit('update:visible', false)
}
</script>

<template>
  <view v-if="visible" class="fixed inset-0 z-[9999] select-none" @touchmove.stop.prevent>
    <!-- 全屏高暗度遮罩 -->
    <view class="absolute inset-0 bg-black/65 transition-opacity" @tap.stop="handleClose" />

    <!-- 底部输入弹层 -->
    <view
      class="absolute left-0 right-0 z-10 box-border w-full bg-white px-3 pt-2.5 shadow-2xl"
      :style="{
        bottom: `${keyboardHeight}px`,
        paddingBottom: keyboardHeight > 0 ? '10px' : 'max(10px, env(safe-area-inset-bottom))',
      }"
      @tap.stop
    >
      <!-- 多行输入区域 -->
      <view class="box-border w-full border border-[#D3BA9F]/60 rounded-xl bg-[#F8F6F2] p-2.5 transition-colors focus-within:border-[#B69171]">
        <textarea
          :value="modelValue"
          :placeholder="placeholder"
          placeholder-class="text-[#8A7E70] text-sm"
          :maxlength="maxLength"
          :focus="isFocus"
          auto-height
          :adjust-position="false"
          :hold-keyboard="true"
          :show-confirm-bar="false"
          class="box-border max-h-[140px] min-h-[44px] w-full text-sm text-[#1E1E1E] leading-relaxed"
          @input="(e: any) => emit('update:modelValue', e.detail?.value ?? '')"
          @keyboardheightchange="(e: any) => keyboardHeight = e.detail?.height ?? 0"
        />
      </view>

      <!-- 单行操作区：表情栏 + 发送按钮 -->
      <view class="mt-2.5 flex items-center gap-2.5" @mousedown.prevent>
        <scroll-view scroll-x :show-scrollbar="false" class="hide-scrollbar min-w-0 flex-1 whitespace-nowrap">
          <view class="inline-flex items-center gap-3 py-0.5">
            <text
              v-for="emoji in emojiList"
              :key="emoji"
              class="cursor-pointer text-xl transition-transform active:scale-125"
              @tap.stop.prevent="handleInsertEmoji(emoji)"
            >
              {{ emoji }}
            </text>
          </view>
        </scroll-view>

        <view
          class="flex flex-shrink-0 cursor-pointer items-center justify-center rounded-full px-4 py-1.5 text-xs font-bold transition-all"
          :class="modelValue.trim() && !loading ? 'bg-[#B69171] text-white shadow-xs active:scale-95' : 'bg-[#F2F2F4] text-[#A0A0A0] cursor-not-allowed'"
          @tap="!loading && modelValue.trim() && emit('submit')"
        >
          <text v-if="loading" class="i-carbon:circle-dash mr-1 animate-spin text-xs" />
          <text>发送</text>
        </view>
      </view>
    </view>
  </view>
</template>
