<template>
  <view
    class="page-my safe-bottom-page--fixed-bar bg-white px-30rpx pt-28rpx"
    :class="{ 'page-my--modal-open': editNameVisible || editAvatarVisible }"
  >
    <view class="page-my__header flex flex-col items-center pb-64rpx pt-34rpx">
      <view
        class="profile-avatar m-0 h-132rpx w-132rpx flex items-center justify-center overflow-hidden rounded-full bg-[#fdf3d7] p-0 leading-normal after:border-none"
        @tap="onAvatarTap"
      >
        <image
          class="h-full w-full"
          :src="userStore.userAvatar"
          mode="aspectFill"
        />
      </view>
      <view
        class="profile-name-wrapper mt-30rpx flex cursor-pointer items-end justify-center gap-12rpx transition-all duration-150 ease-out active:(scale-97 opacity-80)"
        @tap="onNicknameTap"
      >
        <text class="profile-name block max-w-480rpx truncate text-36rpx text-[#161616] font-900 leading-[1.2em]">
          {{ userStore.userInfo?.nickname || '未登录' }}
        </text>
        <wd-icon
          v-if="userStore.isLoggedIn()"
          name="edit"
          color="#a09688"
          size="28rpx"
          class="profile-name-edit mb-6rpx self-end"
        />
      </view>
      <wd-button
        v-if="!userStore.isLoggedIn()"
        type="warning"
        round
        size="small"
        custom-style="margin-top: 24rpx; width: 136rpx;"
        @click="handleLogin"
      >
        登录
      </wd-button>
      <button
        v-else
        class="profile-logout mt-24rpx box-border h-56rpx w-156rpx flex items-center justify-center border-0 rounded-full bg-[#f8f6f2] p-0 text-24rpx text-[#8f8679] font-800 after:border-none"
        @tap="handleLogout"
      >
        退出登录
      </button>
    </view>

    <view
      v-for="group in menuGroups"
      :key="group.label"
      class="my-group mb-34rpx"
    >
      <text class="my-group__label mb-8rpx block text-24rpx text-[#8b8b8b] font-700">
        {{ group.label }}
      </text>

      <view
        v-for="(item, index) in group.items"
        :key="item.path"
        class="my-row flex cursor-pointer items-start gap-22rpx bg-white pt-22rpx"
        @tap="goPage(item)"
      >
        <view
          class="my-row__icon mt-4rpx h-64rpx w-64rpx flex flex-shrink-0 items-center justify-center rounded-14rpx"
          :style="{ background: item.color }"
        >
          <wd-icon :name="item.icon" color="#ffffff" size="30rpx" />
        </view>
        <view
          class="my-row__main min-w-0 flex-1 pb-22rpx"
          :class="index === group.items.length - 1 ? 'border-b-0' : 'border-b-1rpx border-b-solid border-[#eeeeee]'"
        >
          <text class="my-row__title block truncate text-32rpx text-[#161616] font-900">
            {{ item.title }}
          </text>
          <text class="my-row__summary mt-10rpx block truncate text-27rpx text-[#7f7f7f] leading-[1.4em]">
            {{ item.desc }}
          </text>
        </view>
        <view class="my-row__right min-w-46rpx flex flex-shrink-0 items-center self-stretch justify-end pb-22rpx -translate-y-4rpx">
          <text v-if="item.value" class="my-row__value block text-26rpx text-[#9b7621] font-800">
            {{ item.value }}
          </text>
          <wd-icon v-else name="right" color="#c8c1b8" size="26rpx" />
        </view>
      </view>
    </view>

    <!-- 修改昵称弹窗 -->
    <view v-if="editNameVisible" class="fixed inset-0 z-[999] box-border flex items-start justify-center bg-[#211b14]/48 pt-220rpx backdrop-blur-8px" @tap="closeEditName">
      <view class="box-border w-580rpx rounded-28rpx bg-white p-[44rpx_40rpx] shadow-[0_20rpx_60rpx_rgba(31,27,20,0.16)] animate-scale-in" @tap.stop>
        <text class="mb-34rpx block text-center text-32rpx text-[#1f1b14] font-900">修改用户名</text>
        <!-- #ifdef MP-WEIXIN -->
        <input
          v-model="newNickname"
          type="nickname"
          class="box-border h-88rpx w-full border border-[rgba(31,27,20,0.08)] rounded-18rpx border-solid bg-[#fcfbfa] px-24rpx text-28rpx text-[#1f1b14]"
          placeholder="请输入新的用户名"
          :maxlength="16"
          :adjust-position="false"
          :cursor-spacing="0"
          focus
          @focus="keepNicknameModalPosition"
          @blur="onNicknameBlur"
          @input="onNicknameInput"
          @keyboardheightchange="keepNicknameModalPosition"
        >
        <!-- #endif -->
        <!-- #ifndef MP-WEIXIN -->
        <input
          v-model="newNickname"
          type="text"
          class="box-border h-88rpx w-full border border-[rgba(31,27,20,0.08)] rounded-18rpx border-solid bg-[#fcfbfa] px-24rpx text-28rpx text-[#1f1b14]"
          placeholder="请输入新的用户名"
          :maxlength="16"
          :adjust-position="false"
          :cursor-spacing="0"
          focus
          @focus="keepNicknameModalPosition"
          @keyboardheightchange="keepNicknameModalPosition"
        >
        <!-- #endif -->
        <view class="mt-40rpx flex gap-20rpx">
          <button class="h-80rpx flex flex-1 items-center justify-center border-0 rounded-full bg-[#f5f4ef] p-0 text-26rpx text-[#8f8679] font-900 leading-80rpx after:border-0" @tap="closeEditName">
            取消
          </button>
          <button class="h-80rpx flex flex-1 items-center justify-center border-0 rounded-full bg-brand p-0 text-26rpx text-[#1f1b14] font-900 leading-80rpx after:border-0" @tap="confirmEditName">
            保存
          </button>
        </view>
      </view>
    </view>

    <!-- 修改头像弹窗 -->
    <view v-if="editAvatarVisible" class="fixed inset-0 z-[999] box-border flex items-center justify-center bg-[#211b14]/48 backdrop-blur-8px" @tap="closeEditAvatar">
      <view class="box-border w-580rpx rounded-28rpx bg-white p-[44rpx_40rpx] shadow-[0_20rpx_60rpx_rgba(31,27,20,0.16)] animate-scale-in" @tap.stop>
        <text class="mb-34rpx block text-center text-32rpx text-[#1f1b14] font-900">修改头像</text>
        <view class="mb-40rpx text-center text-28rpx text-[#8f8679]">
          是否修改您的用户头像？
        </view>
        <view class="flex gap-20rpx">
          <button class="h-80rpx flex flex-1 items-center justify-center border-0 rounded-full bg-[#f5f4ef] p-0 text-26rpx text-[#8f8679] font-900 leading-80rpx after:border-0" @tap="closeEditAvatar">
            取消
          </button>
          <!-- #ifdef MP-WEIXIN -->
          <button
            class="h-80rpx flex flex-1 items-center justify-center border-0 rounded-full bg-brand p-0 text-26rpx text-[#1f1b14] font-900 leading-80rpx after:border-0"
            open-type="chooseAvatar"
            @chooseavatar="onChooseAvatarWithClose"
          >
            确定
          </button>
          <!-- #endif -->
          <!-- #ifndef MP-WEIXIN -->
          <button
            class="h-80rpx flex flex-1 items-center justify-center border-0 rounded-full bg-brand p-0 text-26rpx text-[#1f1b14] font-900 leading-80rpx after:border-0"
            @tap="confirmEditAvatar"
          >
            确定
          </button>
          <!-- #endif -->
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAvatarEditor } from './composables/useAvatarEditor'
import { isMockLoginEnabled, useAuth } from '@/composables/useAuth'
import { useTimer } from '@/composables/useTimer'
import { useUserStore } from '@/store/user'
import { getMyMenuGroups } from './features'
import type { MyMenuItem } from './features'

interface InputValueEvent {
  detail?: {
    value?: string
  }
}

definePage({
  style: {
    navigationBarTitleText: '%page.my%',
  },
})

const userStore = useUserStore()
const { ensureLogin, setMockLogin, startOAuthLogin } = useAuth()
const timer = useTimer()

const menuGroups = computed(() => getMyMenuGroups(userStore.userInfo?.points ?? 0))
const {
  editAvatarVisible,
  onAvatarTap,
  closeEditAvatar,
  confirmEditAvatar,
  onChooseAvatarWithClose,
} = useAvatarEditor()

// 昵称修改状态
const editNameVisible = ref(false)
const newNickname = ref('')

function onNicknameBlur(e: InputValueEvent) {
  if (e.detail && typeof e.detail.value === 'string') {
    newNickname.value = e.detail.value
  }
}

function onNicknameInput(e: InputValueEvent) {
  if (e.detail && typeof e.detail.value === 'string') {
    newNickname.value = e.detail.value
  }
}

function keepNicknameModalPosition() {
  const restoreDelays = [0, 50, 150, 300]

  restoreDelays.forEach((delay) => {
    timer.setTimeout(() => {
      uni.pageScrollTo({
        scrollTop: 0,
        duration: 0,
      })
    }, delay)
  })
}

function onNicknameTap() {
  if (!userStore.isLoggedIn()) {
    return
  }
  newNickname.value = userStore.userInfo?.nickname || ''
  editNameVisible.value = true
}

function closeEditName() {
  editNameVisible.value = false
}

function confirmEditName() {
  const name = newNickname.value.trim()
  if (!name) {
    uni.showToast({
      title: '用户名不能为空',
      icon: 'none',
    })
    return
  }
  userStore.updateUserInfo({ nickname: name })
  uni.showToast({
    title: '修改成功',
    icon: 'success',
  })
  editNameVisible.value = false
}

async function handleLogin() {
  if (isMockLoginEnabled) {
    setMockLogin()
  }
  else {
    await startOAuthLogin()
    return
  }

  uni.showToast({
    title: '登录成功',
    icon: 'success',
  })
}

function handleLogout() {
  uni.showModal({
    title: '退出登录',
    content: '确认退出当前账号吗？',
    cancelText: '取消',
    confirmText: '退出',
    confirmColor: '#d96a78',
    success: (res) => {
      if (!res.confirm) {
        return
      }

      userStore.logout()
      editNameVisible.value = false
      uni.showToast({
        title: '已退出登录',
        icon: 'success',
      })
    },
  })
}

async function goPage(item: MyMenuItem) {
  if (item.requiresLogin && !(await ensureLogin())) {
    return
  }

  uni.navigateTo({
    url: item.path,
  })
}
</script>
