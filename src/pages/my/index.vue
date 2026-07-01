<template>
  <view class="page-my safe-bottom-page--fixed-bar" :class="{ 'page-my--modal-open': editNameVisible || editAvatarVisible }">
    <view class="page-my__header">
      <view v-if="userStore.isLoggedIn()" class="profile-avatar" @tap="onAvatarTap">
        <image
          class="profile-avatar__image"
          :src="userStore.userAvatar"
          mode="aspectFill"
        />
      </view>
      <view v-else class="profile-avatar">
        <image
          class="profile-avatar__image"
          :src="userStore.userAvatar"
          mode="aspectFill"
        />
      </view>
      <view class="profile-name-wrapper" @tap="onNicknameTap">
        <text class="profile-name">{{ userStore.userInfo?.nickname || '未登录' }}</text>
        <wd-icon v-if="userStore.isLoggedIn()" name="edit" color="#a09688" size="28rpx" class="profile-name-edit" />
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
      <button v-else class="profile-logout" @tap="handleLogout">
        退出登录
      </button>
    </view>

    <view v-for="group in menuGroups" :key="group.label" class="my-group">
      <text class="my-group__label">{{ group.label }}</text>

      <view
        v-for="item in group.items"
        :key="item.path"
        class="my-row"
        @tap="goPage(item)"
      >
        <view class="my-row__icon" :style="{ background: item.color }">
          <wd-icon :name="item.icon" color="#ffffff" size="30rpx" />
        </view>
        <view class="my-row__main">
          <text class="my-row__title">{{ item.title }}</text>
          <text class="my-row__summary">{{ item.desc }}</text>
        </view>
        <view class="my-row__right">
          <text v-if="item.value" class="my-row__value">{{ item.value }}</text>
          <wd-icon v-else name="right" color="#c8c1b8" size="26rpx" />
        </view>
      </view>
    </view>

    <!-- 修改昵称弹窗 -->
    <view v-if="editNameVisible" class="custom-modal-mask" @tap="closeEditName">
      <view class="custom-modal" @tap.stop>
        <text class="custom-modal__title">修改用户名</text>
        <!-- #ifdef MP-WEIXIN -->
        <input
          v-model="newNickname"
          type="nickname"
          class="custom-modal__input"
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
          class="custom-modal__input"
          placeholder="请输入新的用户名"
          :maxlength="16"
          :adjust-position="false"
          :cursor-spacing="0"
          focus
          @focus="keepNicknameModalPosition"
          @keyboardheightchange="keepNicknameModalPosition"
        >
        <!-- #endif -->
        <view class="custom-modal__actions">
          <button class="custom-modal__btn custom-modal__btn--cancel" @tap="closeEditName">
            取消
          </button>
          <button class="custom-modal__btn custom-modal__btn--confirm" @tap="confirmEditName">
            保存
          </button>
        </view>
      </view>
    </view>

    <!-- 修改头像弹窗 -->
    <view v-if="editAvatarVisible" class="custom-modal-mask custom-modal-mask--center" @tap="closeEditAvatar">
      <view class="custom-modal" @tap.stop>
        <text class="custom-modal__title">修改头像</text>
        <view class="custom-modal__content" style="text-align: center; margin-bottom: 40rpx; color: #8f8679; font-size: 28rpx;">
          是否修改您的用户头像？
        </view>
        <view class="custom-modal__actions">
          <button class="custom-modal__btn custom-modal__btn--cancel" @tap="closeEditAvatar">
            取消
          </button>
          <!-- #ifdef MP-WEIXIN -->
          <button
            class="custom-modal__btn custom-modal__btn--confirm"
            open-type="chooseAvatar"
            @chooseavatar="onChooseAvatarWithClose"
          >
            确定
          </button>
          <!-- #endif -->
          <!-- #ifndef MP-WEIXIN -->
          <button
            class="custom-modal__btn custom-modal__btn--confirm"
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

<style scoped lang="scss">
.page-my {
  padding: 28rpx 30rpx 0;
  background: #ffffff;
}

.page-my--modal-open {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1000;
  width: 100%;
  overflow: hidden;
}

.page-my__header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 34rpx 0 64rpx;
}

.profile-avatar__text,
.profile-name,
.my-group__label,
.my-row__title,
.my-row__value,
.my-row__summary {
  display: block;
}

.profile-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 132rpx;
  height: 132rpx;
  overflow: hidden;
  background: #fdf3d7;
  border-radius: 50%;
}

.profile-avatar__image {
  width: 100%;
  height: 100%;
}

.profile-logout {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 156rpx;
  height: 56rpx;
  margin: 24rpx 0 0;
  padding: 0;
  font-size: 24rpx;
  font-weight: 800;
  line-height: 56rpx;
  color: #8f8679;
  background: #f8f6f2;
  border: 0;
  border-radius: 999rpx;
}

.profile-logout::after {
  border: 0;
}

.profile-avatar__text {
  font-size: 54rpx;
  font-weight: 900;
  color: var(--tx-color-primary);
}

.profile-name-wrapper {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 12rpx;
  margin-top: 30rpx;
  cursor: pointer;
  transition: transform 0.15s ease;

  &:active {
    transform: scale(0.97);
    opacity: 0.8;
  }
}

.profile-name {
  overflow: hidden;
  max-width: 480rpx;
  font-size: 36rpx;
  font-weight: 900;
  color: #161616;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
}

.profile-name-edit {
  align-self: flex-end;
  margin-bottom: 6rpx;
}

.my-group {
  margin-bottom: 34rpx;
}

.my-group__label {
  margin: 0 0 8rpx 0;
  font-size: 24rpx;
  font-weight: 700;
  color: #8b8b8b;
}

.my-row {
  display: flex;
  align-items: flex-start;
  gap: 22rpx;
  padding: 22rpx 0 0;
  background: #ffffff;
}

.my-row__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 64rpx;
  height: 64rpx;
  margin-top: 4rpx;
  border-radius: 14rpx;
}

.my-row__main {
  flex: 1;
  min-width: 0;
  padding-bottom: 22rpx;
  border-bottom: 1rpx solid #eeeeee;
}

.my-row:last-child .my-row__main {
  border-bottom: 0;
}

.my-row__title {
  overflow: hidden;
  flex: 1;
  font-size: 32rpx;
  font-weight: 900;
  color: #161616;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.my-row__value {
  font-size: 26rpx;
  font-weight: 800;
  color: #9b7621;
}

.my-row__right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  align-self: stretch;
  flex-shrink: 0;
  min-width: 46rpx;
  padding-bottom: 22rpx;
  transform: translateY(-4rpx);
}

.my-row__summary {
  overflow: hidden;
  margin-top: 10rpx;
  font-size: 27rpx;
  line-height: 1.4;
  color: #7f7f7f;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 重置微信小程序下 button 属性作为头像容器时的样式 */
button.profile-avatar {
  padding: 0;
  margin: 0;
  line-height: normal;
  border: 0;
  background: #fdf3d7;
  &::after {
    border: none;
  }
}

@keyframes scale-in {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* 昵称修改模态框 */
.custom-modal-mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 999;
  background: rgba(31, 27, 20, 0.48);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 220rpx;
  backdrop-filter: blur(8px);
  box-sizing: border-box;
}

.custom-modal-mask--center {
  align-items: center;
  padding-top: 0;
}

.custom-modal {
  width: 580rpx;
  background: #ffffff;
  border-radius: 28rpx;
  padding: 44rpx 40rpx;
  box-sizing: border-box;
  box-shadow: 0 20rpx 60rpx rgba(31, 27, 20, 0.16);
  animation: scale-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.custom-modal__title {
  display: block;
  font-size: 32rpx;
  font-weight: 900;
  color: #1f1b14;
  text-align: center;
  margin-bottom: 34rpx;
}

.custom-modal__input {
  width: 100%;
  height: 88rpx;
  background: #fcfbfa;
  border: 1rpx solid rgba(31, 27, 20, 0.08);
  border-radius: 18rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #1f1b14;
  box-sizing: border-box;
}

.custom-modal__actions {
  display: flex;
  gap: 20rpx;
  margin-top: 40rpx;
}

.custom-modal__btn {
  flex: 1;
  height: 80rpx;
  font-size: 26rpx;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  border: 0;
  line-height: 80rpx;

  &::after {
    border: 0;
  }

  &--confirm {
    background: var(--tx-color-primary);
    color: #1f1b14;
  }

  &--cancel {
    background: #f5f4ef;
    color: #8f8679;
  }
}
</style>
