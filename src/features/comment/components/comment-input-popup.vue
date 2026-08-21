<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    visible: boolean
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
  (e: 'submit'): void
}>()

const text = defineModel<string>({ default: '' })

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
  catch {
    // 读取本地缓存失败时使用默认表情
  }
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
  if (text.value.length + emoji.length > props.maxLength)
    return
  text.value += emoji
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
  <wd-popup
    :model-value="visible"
    position="bottom"
    :z-index="1000"
    :lock-scroll="true"
    :safe-area-inset-bottom="keyboardHeight <= 0"
    :custom-style="`background: #FFFFFF; width: 100%; border-radius: 20rpx 20rpx 0 0; padding-bottom: ${keyboardHeight > 0 ? keyboardHeight + 10 : 10}px;`"
    @close="handleClose"
  >
    <view class="box-border w-full select-none px-3 pt-2.5">
      <!-- 多行输入区域 -->
      <view class="box-border w-full border border-tx-border/60 rounded-xl bg-tx-surface p-2.5 transition-colors focus-within:border-tx-brown">
        <textarea
          :value="text"
          :placeholder="placeholder"
          placeholder-class="text-tx-ink-3 text-base"
          :maxlength="maxLength"
          :focus="isFocus"
          auto-height
          :adjust-position="false"
          :hold-keyboard="true"
          :show-confirm-bar="false"
          class="box-border max-h-[140px] min-h-[46px] w-full text-base text-tx-ink leading-relaxed"
          @input="(e: any) => text = e.detail?.value ?? ''"
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
          :class="text.trim() && !loading ? 'bg-tx-brown text-white shadow-xs active:scale-95' : 'bg-[#F2F2F4] text-[#A0A0A0] cursor-not-allowed'"
          @tap="!loading && text.trim() && emit('submit')"
        >
          <text v-if="loading" class="i-carbon:circle-dash mr-1 animate-spin text-xs" />
          <text>发送</text>
        </view>
      </view>
    </view>
  </wd-popup>
</template>
