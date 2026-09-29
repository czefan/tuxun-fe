<script setup lang="ts">
import { useAuthStore } from '@/store/auth'
import { computed, ref, watch } from 'vue'
import { useUserStore } from '@/features/user/store/user'
import { useAuth } from '@/features/user/composables/use-auth'
import { useUpdateAvatar } from '@/features/user/query'
import { smartCompressImage } from '@/utils/image-compress'

interface Props {
  currentAvatar?: string
  remaining?: number
}

const props = withDefaults(defineProps<Props>(), {
  currentAvatar: '',
  remaining: 0,
})

const visible = defineModel<boolean>('visible', { default: false })

const userStore = useUserStore()
const { requireLogin } = useAuth()
const avatarMutation = useUpdateAvatar()

const selectedAvatarPath = ref('')
const preparing = ref(false)

watch(
  () => visible.value,
  (val) => {
    if (val) {
      selectedAvatarPath.value = ''
    }
  },
)

const modalAvatarUrl = computed(() => {
  if (selectedAvatarPath.value) return selectedAvatarPath.value
  const url = props.currentAvatar || userStore.userInfo?.avatar
  return url && url.trim() ? url : '/static/images/default-avatar.png'
})

function handleClose() {
  selectedAvatarPath.value = ''
  visible.value = false
}

function startChooseAvatar() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => (selectedAvatarPath.value = res.tempFilePaths[0] || ''),
  })
}

function handleChooseAvatar(e: any) {
  selectedAvatarPath.value = e.detail?.avatarUrl || ''
}

async function confirmUpdateAvatar() {
  if (preparing.value || avatarMutation.isPending.value) return
  const sessionVersion = useAuthStore().sessionVersion
  if (!requireLogin()) return
  if (props.remaining <= 0) {
    return uni.showToast({ title: '头像修改次数已用尽', icon: 'none' })
  }
  if (!selectedAvatarPath.value) {
    return uni.showToast({ title: '请先选择新头像', icon: 'none' })
  }

  preparing.value = true
  let compressedPath = selectedAvatarPath.value
  try {
    compressedPath = await smartCompressImage(selectedAvatarPath.value)
  } catch {
    return
  } finally {
    preparing.value = false
  }
  if (sessionVersion !== useAuthStore().sessionVersion) return
  avatarMutation.mutate(compressedPath, {
    onSuccess: (res) => {
      if (sessionVersion !== useAuthStore().sessionVersion) return
      userStore.updateUserInfo({
        avatar: res.avatarUrl,
        avatarEditsRemaining: res.avatarEditsRemaining,
      })
      selectedAvatarPath.value = ''
      visible.value = false
      uni.showToast({ title: '头像更新成功', icon: 'none' })
    },
  })
}
</script>

<template>
  <wd-popup
    v-model="visible"
    position="center"
    custom-style="background: transparent; width: 88vw; max-width: 620rpx; overflow: visible;"
    @close="handleClose"
  >
    <view
      class="box-border w-full border border-tx-border rounded-[22px] bg-white p-5 shadow-xl space-y-4"
    >
      <!-- 标题栏 -->
      <view class="flex items-center justify-between border-b border-tx-border/30 pb-3">
        <view class="flex items-center gap-2">
          <view class="h-4 w-1.5 rounded-full bg-tx-accent" />
          <text class="u-title-lg">修改个人头像</text>
        </view>
        <wd-tag
          type="warning"
          round
          size="small"
          custom-class="!font-bold !bg-tx-accent/50 !text-[#854D0E] !border-0"
        >
          剩余 {{ remaining }} 次
        </wd-tag>
      </view>

      <!-- 头像预览区：纯粹精致单环与柔和阴影，突显图片内容 -->
      <view class="flex justify-center py-3">
        <wd-img
          :key="modalAvatarUrl"
          lazy-load
          custom-class="h-28 w-28 rounded-full bg-tx-surface object-cover ring-2 ring-tx-brown/30 shadow-md"
          :src="modalAvatarUrl"
          mode="aspectFill"
          round
          width="224rpx"
          height="224rpx"
        />
      </view>

      <!-- 操作区 -->
      <view class="space-y-2.5">
        <!-- #ifdef MP-WEIXIN -->
        <button
          class="m-0 w-full border-none bg-transparent p-0 outline-none"
          open-type="chooseAvatar"
          @chooseavatar="handleChooseAvatar"
        >
          <wd-button
            round
            block
            size="medium"
            custom-class="!bg-tx-surface !text-tx-ink !border !border-tx-border/60 !font-bold"
          >
            <template #icon>
              <wd-icon name="picture" size="16px" custom-class="text-[#D97706]" />
            </template>
            选择图片
          </wd-button>
        </button>
        <!-- #endif -->
        <!-- #ifndef MP-WEIXIN -->
        <wd-button
          round
          block
          size="medium"
          custom-class="!bg-tx-surface !text-tx-ink !border !border-tx-border/60 !font-bold"
          @click="startChooseAvatar"
        >
          <template #icon>
            <wd-icon name="picture" size="16px" custom-class="text-[#D97706]" />
          </template>
          选择图片
        </wd-button>
        <!-- #endif -->

        <view class="flex gap-3 pt-1">
          <wd-button
            class="flex-1"
            round
            size="medium"
            custom-class="!bg-tx-surface !text-tx-ink-2 !border !border-tx-border/50 !font-bold"
            @click="handleClose"
          >
            取消
          </wd-button>
          <wd-button
            class="flex-1"
            round
            size="medium"
            custom-class="!bg-tx-accent !text-tx-ink !font-black shadow-xs active:scale-95 transition-transform"
            :disabled="!selectedAvatarPath || preparing || avatarMutation.isPending.value"
            :loading="preparing || avatarMutation.isPending.value"
            @click="confirmUpdateAvatar"
          >
            确认修改
          </wd-button>
        </view>
      </view>
    </view>
  </wd-popup>
</template>
