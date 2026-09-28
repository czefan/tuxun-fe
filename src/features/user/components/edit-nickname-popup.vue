<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useUserStore } from '@/features/user/store/user'
import { useAuth } from '@/features/user/composables/use-auth'
import { useUpdateNickname } from '@/features/user/query'

interface Props {
  nickname?: string
  remaining?: number
}

const props = withDefaults(defineProps<Props>(), {
  nickname: '',
  remaining: 0,
})

const visible = defineModel<boolean>('visible', { default: false })

const userStore = useUserStore()
const { requireLogin } = useAuth()
const nicknameMutation = useUpdateNickname()

const newNickname = ref('')

watch(
  () => visible.value,
  (val) => {
    if (val) {
      newNickname.value = props.nickname || userStore.userInfo?.nickname || ''
    }
  },
  { immediate: true },
)

const canSaveNickname = computed(() => {
  const trimmed = newNickname.value.trim()
  const current = props.nickname || userStore.userInfo?.nickname || ''
  return !!trimmed && trimmed !== current && trimmed.length <= 10
})

function handleClose() {
  visible.value = false
}

function confirmNickname() {
  if (!requireLogin()) return
  if (!canSaveNickname.value) return

  nicknameMutation.mutate(newNickname.value.trim(), {
    onSuccess: (res) => {
      userStore.updateUserInfo({
        nickname: res.nickname,
        nicknameEditsRemaining: res.nicknameEditsRemaining,
      })
      visible.value = false
      uni.showToast({ title: '修改成功', icon: 'none' })
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
          <text class="u-title-lg">修改个人昵称</text>
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

      <!-- 输入框 -->
      <view class="space-y-1">
        <text class="block text-xs text-tx-ink-2 font-bold">新昵称</text>
        <wd-input
          v-model="newNickname"
          placeholder="请输入新昵称 (≤10字)"
          :maxlength="10"
          clearable
          custom-class="!bg-tx-surface !rounded-xl !p-3 !border !border-tx-border/60"
        />
      </view>

      <!-- 操作按钮 -->
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
          :disabled="!canSaveNickname || nicknameMutation.isPending.value"
          :loading="nicknameMutation.isPending.value"
          @click="confirmNickname"
        >
          确认修改
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>
