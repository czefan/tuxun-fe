<script setup lang="ts">
import { computed, ref } from 'vue'
import { MENU_GROUPS } from './menu-groups'
import { useUserStore } from '@/features/user'
import { useAuth } from '@/features/user/composables/use-auth'
import { useUserInfo } from '@/features/user/query'
import EditNicknamePopup from '@/features/user/components/edit-nickname-popup.vue'
import EditAvatarPopup from '@/features/user/components/edit-avatar-popup.vue'
import { AppRoute } from '@/router/routes'
import { clearReturnPath, redirectToLogout } from '@/service/auth/login'
import { TX_INK } from '@/styles/constants'

definePage({
  style: {
    navigationBarTitleText: '%page.profile%',
  },
})

const userStore = useUserStore()
const { isLoggedIn, loginDirectly, logout } = useAuth()

const editNameVisible = ref(false)
const editAvatarVisible = ref(false)

const { data: profileInfo } = useUserInfo({ silentAuth: true, enabled: () => isLoggedIn() })

const currentNickname = computed(
  () => profileInfo.value?.nickname || userStore.userInfo?.nickname || '',
)
const nicknameRemaining = computed(
  () =>
    profileInfo.value?.nicknameEditsRemaining ?? userStore.userInfo?.nicknameEditsRemaining ?? 0,
)

const heroAvatarUrl = computed(() => {
  const url = profileInfo.value?.avatar || userStore.userInfo?.avatar
  return url && url.trim() ? url : '/static/images/default-avatar.png'
})

const avatarRemaining = computed(
  () => profileInfo.value?.avatarEditsRemaining ?? userStore.userInfo?.avatarEditsRemaining ?? 0,
)

function handleLogout() {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    confirmText: '确定退出',
    cancelText: '取消',
    confirmColor: '#EF4444',
    success: async (res) => {
      if (!res.confirm) {
        return
      }
      const { serverCleared } = await logout()
      clearReturnPath()
      if (!serverCleared) {
        uni.showToast({ title: '服务端会话清除失败', icon: 'none' })
      }
      redirectToLogout()
    },
  })
}

function openEditNickname() {
  if (!isLoggedIn()) return loginDirectly()
  editNameVisible.value = true
}

function openEditAvatar() {
  if (!isLoggedIn()) return loginDirectly()
  editAvatarVisible.value = true
}

function navigateTo(url: string) {
  uni.navigateTo({ url })
}
</script>

<template>
  <view class="page-my safe-bottom-page--fixed-bar bg-tx-main px-3 pt-3 space-y-4">
    <!-- 用户身份单层精质通行证卡片 (Design-Spec #D3BA9F Passport Hero Card) -->
    <view
      class="shadow-2xs overflow-hidden border border-tx-brown/40 rounded-[18px] bg-tx-border p-4.5 text-tx-ink"
    >
      <view v-if="isLoggedIn()" class="space-y-2">
        <view class="flex items-center justify-between">
          <view class="flex items-center gap-3.5">
            <view
              class="relative cursor-pointer transition-transform active:scale-95"
              @click="openEditAvatar"
            >
              <wd-img
                :key="heroAvatarUrl"
                custom-class="h-16 w-16 rounded-full bg-tx-surface object-cover ring-2 ring-tx-brown shadow-xs"
                :src="heroAvatarUrl"
                lazy-load
                mode="aspectFill"
                round
                width="128rpx"
                height="128rpx"
              />
              <view
                class="shadow-xs absolute h-5 w-5 flex items-center justify-center rounded-full bg-tx-accent text-tx-ink ring-1 ring-white -bottom-0.5 -right-0.5"
              >
                <text class="i-carbon-camera text-3xs font-black" />
              </view>
            </view>

            <view class="space-y-1">
              <!-- 点击昵称直接弹出修改 -->
              <view
                class="inline-flex cursor-pointer items-center gap-1.5 active:opacity-75"
                @click="openEditNickname"
              >
                <text class="text-xl text-tx-ink font-black tracking-tight">
                  {{ profileInfo?.nickname || userStore.userInfo?.nickname }}
                </text>
                <wd-icon name="edit" size="14px" color="#756C5E" />
                <view
                  class="shadow-2xs rounded-full bg-tx-accent px-2.5 py-0.5 text-[10px] text-tx-ink font-black"
                >
                  {{
                    profileInfo?.isAdmin || userStore.userInfo?.isAdmin
                      ? '管理员'
                      : `Level ${profileInfo?.level || userStore.userInfo?.level || 1}`
                  }}
                </view>
              </view>
              <text class="block text-sm text-tx-ink-2 font-bold font-numeric">
                ID:
                {{
                  profileInfo?.id ||
                  userStore.userInfo?.id ||
                  profileInfo?.netid ||
                  userStore.userInfo?.netid
                }}
              </text>
            </view>
          </view>
        </view>

        <!-- 总积分 (向上靠紧，留白缩减) -->
        <view class="flex items-center justify-end border-t border-tx-brown/30 pt-1.5">
          <view
            class="flex cursor-pointer items-center gap-1 active:opacity-75"
            @click="navigateTo(AppRoute.MyPoints)"
          >
            <text class="text-xs text-tx-ink-2 font-medium">总积分:</text>
            <text class="ml-0.5 text-base text-tx-ink font-bold font-numeric">
              {{ profileInfo?.points ?? userStore.userInfo?.points ?? 0 }}
            </text>
          </view>
        </view>
      </view>

      <view v-else class="flex items-center justify-between py-1">
        <view class="flex items-center gap-3.5">
          <view
            class="shadow-xs h-12 w-12 flex items-center justify-center rounded-full bg-tx-accent text-tx-ink"
          >
            <wd-icon name="user" size="24px" :color="TX_INK" />
          </view>
          <view>
            <text class="block text-lg text-tx-ink font-black">未登录账户</text>
            <text class="mt-0.5 block text-xs text-tx-ink-2 font-bold">
              登录解锁校园机位与积分探索
            </text>
          </view>
        </view>
        <wd-button
          size="small"
          round
          type="warning"
          custom-class="!font-bold !bg-tx-accent !text-tx-ink shadow-xs"
          @click="loginDirectly"
        >
          去登录
        </wd-button>
      </view>
    </view>

    <!-- 功能列表：按 活动 / 积分 / 更多 3 大板块区分与呈现 -->
    <view class="space-y-4">
      <view v-for="group in MENU_GROUPS" :key="group.title" class="space-y-1">
        <text
          class="block px-1 text-xs text-tx-ink-2 font-black tracking-wider font-mono uppercase"
        >
          {{ group.title }}
        </text>

        <view class="border-y border-tx-brown">
          <view
            v-for="(item, index) in group.items"
            :key="item.title"
            class="flex cursor-pointer items-center justify-between py-3.5 transition-colors active:opacity-75"
            :class="index > 0 ? 'border-t border-tx-brown' : ''"
            @click="navigateTo(item.route)"
          >
            <view class="flex items-center gap-3.5">
              <view
                class="h-8 w-8 flex items-center justify-center rounded-full bg-tx-brown/15 text-tx-brown"
              >
                <text class="text-lg font-bold" :class="item.icon" />
              </view>
              <text class="text-sm text-tx-ink font-black tracking-tight">{{ item.title }}</text>
            </view>
            <wd-icon name="arrow-right" size="14px" color="#756C5E" />
          </view>
        </view>
      </view>
    </view>

    <!-- 退出登录按钮 -->
    <view v-if="isLoggedIn()" class="pt-2">
      <wd-button
        round
        block
        type="danger"
        size="large"
        custom-class="!font-bold shadow-xs"
        @click="handleLogout"
      >
        退出登录
      </wd-button>
    </view>

    <!-- 修改昵称 Popup -->
    <EditNicknamePopup
      v-model:visible="editNameVisible"
      :nickname="currentNickname"
      :remaining="nicknameRemaining"
    />

    <!-- 修改头像 Popup -->
    <EditAvatarPopup
      v-model:visible="editAvatarVisible"
      :current-avatar="heroAvatarUrl"
      :remaining="avatarRemaining"
    />
  </view>
</template>
