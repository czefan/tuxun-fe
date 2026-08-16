<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAuth } from '@/features/user/composables/use-auth'
import { useContent } from '@/features/content/query'
import { AppRoute, withQuery } from '@/router/routes'
import { StorageKey } from '@/constants/storage'

/**
 * 全站公告弹窗组件
 *
 * 显示逻辑：
 *  - 请求 /contents/popup 拿到当前弹窗内容与版本号
 *  - 与 localStorage 中上次已读版本对比，版本更新且在当前会话未弹过时弹出
 *  - 已登录且有 relatedId：显示"查看通知"按钮，导航至通知详情页
 *  - 未登录或无 relatedId：仅显示"关闭"按钮
 */

// 模块级（非组件实例级）：同一会话内多个页面实例共享，避免跨页面导航重复弹出
let shownInThisSession = false

const { isLoggedIn } = useAuth()
const visible = ref(false)
const { data: popup } = useContent('popup')

const hasRelated = computed(() => Boolean(popup.value?.relatedId) && isLoggedIn())

watch(
  popup,
  (val) => {
    if (!val || shownInThisSession)
      return

    // content 为空或只有空白文本，不弹出
    const text = val.content?.replace(/<[^>]*>/g, '').trim()
    if (!text)
      return

    const lastSeen = uni.getStorageSync(StorageKey.AnnouncementLastSeenVersion)
    if (String(val.version) !== String(lastSeen)) {
      shownInThisSession = true
      visible.value = true
    }
  },
  { immediate: true },
)

function handleClose() {
  if (popup.value) {
    uni.setStorageSync(StorageKey.AnnouncementLastSeenVersion, String(popup.value.version))
  }
  visible.value = false
}

function handleViewNotice() {
  if (!popup.value?.relatedId) {
    handleClose()
    return
  }
  handleClose()
  uni.navigateTo({
    url: withQuery(AppRoute.NoticeDetail, { id: popup.value.relatedId }),
  })
}
</script>

<template>
  <wd-popup
    v-if="popup && visible"
    :model-value="visible"
    position="center"
    :z-index="1000"
    :lock-scroll="true"
    custom-style="background: transparent; width: 85vw; max-width: 600rpx; margin: 0 auto;"
    @close="handleClose"
  >
    <view class="relative mx-auto w-full flex flex-col overflow-hidden border border-[#D3BA9F] rounded-2xl bg-white shadow-2xl">
      <!-- 右上角关闭按钮 -->
      <view
        class="absolute right-3 top-3 z-10 h-7 w-7 flex cursor-pointer items-center justify-center rounded-full bg-black/10 text-[#756C5E] backdrop-blur-md transition-transform active:scale-90"
        @tap="handleClose"
      >
        <wd-icon name="close" size="14px" />
      </view>

      <!-- 公告正文（支持超长富文本内容上下滑动） -->
      <scroll-view scroll-y class="box-border max-h-[60vh] min-w-0 w-full px-5 pb-4 pt-10">
        <rich-text :nodes="popup.content" class="block break-words" />
      </scroll-view>

      <!-- 底部操作区 -->
      <view class="flex justify-end gap-2 border-t border-[#D3BA9F]/30 px-5 pb-5 pt-4">
        <view
          v-if="hasRelated"
          class="flex cursor-pointer items-center gap-1 border border-[#D3BA9F] rounded-xl bg-white px-4 py-2 text-sm text-[#756C5E] font-medium transition-all active:scale-95 active:opacity-75"
          @tap="handleClose"
        >
          <text>关闭</text>
        </view>
        <view
          class="shadow-xs flex cursor-pointer items-center gap-1 rounded-xl bg-[#F9DF95] px-4 py-2 text-sm text-[#1E1E1E] font-bold transition-all active:scale-95"
          @tap="hasRelated ? handleViewNotice() : handleClose()"
        >
          <text>{{ hasRelated ? '查看通知' : '关闭' }}</text>
          <text v-if="hasRelated" class="i-carbon:arrow-right text-xs" />
        </view>
      </view>
    </view>
  </wd-popup>
</template>
