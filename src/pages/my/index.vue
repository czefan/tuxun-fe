<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/features/user'
import { useAuth } from '@/features/user/composables/use-auth'
import { useUpdateAvatar, useUpdateNickname, useUserInfo } from '@/features/user/query'
import { smartCompressImage } from '@/utils/image-compress'
import { AppRoute } from '@/router/routes'

definePage({
  style: {
    navigationBarTitleText: '%page.my%',
  },
})

const userStore = useUserStore()
const { isLoggedIn, loginDirectly, logout } = useAuth()

const editNameVisible = ref(false)
const editAvatarVisible = ref(false)
const newNickname = ref('')

const { data: profileInfo } = useUserInfo({ silentAuth: true, enabled: () => isLoggedIn() })
const nicknameMutation = useUpdateNickname()
const avatarMutation = useUpdateAvatar()

const menuGroups = [
  {
    title: '活动',
    items: [
      { title: '我的投稿', route: AppRoute.MyContributions, icon: 'i-carbon:camera', color: 'bg-amber-500/10 text-amber-600' },
      { title: '我的答题', route: AppRoute.MyAnswers, icon: 'i-carbon:task', color: 'bg-emerald-500/10 text-emerald-600' },
    ],
  },
  {
    title: '积分',
    items: [
      { title: '积分明细', route: AppRoute.MyPoints, icon: 'i-carbon:currency-dollar', color: 'bg-indigo-500/10 text-indigo-600' },
      { title: '积分商城', route: AppRoute.Mall, icon: 'i-carbon:store', color: 'bg-purple-500/10 text-purple-600' },
    ],
  },
  {
    title: '更多',
    items: [
      { title: '帮助中心', route: AppRoute.MyHelp, icon: 'i-carbon:help', color: 'bg-teal-500/10 text-teal-600' },
      { title: '意见反馈', route: AppRoute.MyFeedback, icon: 'i-carbon:chat', color: 'bg-blue-500/10 text-blue-600' },
      { title: '关于我们', route: AppRoute.MyAbout, icon: 'i-carbon:information', color: 'bg-rose-500/10 text-rose-600' },
    ],
  },
]

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
      uni.showToast({
        title: serverCleared ? '已退出登录' : '已退出登录（服务端会话清除失败）',
        icon: 'none',
      })
    },
  })
}

function openEditNickname() {
  if (!isLoggedIn())
    return loginDirectly()
  newNickname.value = profileInfo.value?.nickname || userStore.userInfo?.nickname || ''
  editNameVisible.value = true
}

const selectedAvatarPath = ref('')

function openEditAvatar() {
  if (!isLoggedIn())
    return loginDirectly()
  selectedAvatarPath.value = ''
  editAvatarVisible.value = true
}

function confirmNickname() {
  if (!newNickname.value.trim())
    return uni.showToast({ title: '昵称不能为空', icon: 'none' })
  if (newNickname.value.length > 10)
    return uni.showToast({ title: '昵称最多10个字符', icon: 'none' })

  nicknameMutation.mutate(newNickname.value.trim(), {
    onSuccess: (res) => {
      userStore.updateUserInfo({ nickname: res.nickname, nicknameEditsRemaining: res.nicknameEditsRemaining })
      editNameVisible.value = false
      uni.showToast({ title: '修改成功', icon: 'none' })
    },
  })
}

function startChooseAvatar() {
  const remaining = profileInfo.value?.avatarEditsRemaining ?? userStore.userInfo?.avatarEditsRemaining
  if (remaining !== undefined && remaining <= 0) {
    return uni.showToast({ title: '头像修改次数已用尽', icon: 'none' })
  }

  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      if (res.tempFilePaths[0]) {
        selectedAvatarPath.value = res.tempFilePaths[0]
      }
    },
  })
}

function handleChooseAvatar(e: any) {
  if (e.detail?.avatarUrl) {
    selectedAvatarPath.value = e.detail.avatarUrl
  }
}

function confirmUpdateAvatar() {
  if (!selectedAvatarPath.value) {
    return uni.showToast({ title: '请先选择新头像', icon: 'none' })
  }
  void handleAvatarUpload(selectedAvatarPath.value)
}

async function handleAvatarUpload(filePath: string) {
  const compressedPath = await smartCompressImage(filePath)
  avatarMutation.mutate(compressedPath, {
    onSuccess: (res) => {
      userStore.updateUserInfo({ avatar: res.avatarUrl, avatarEditsRemaining: res.avatarEditsRemaining })
      selectedAvatarPath.value = ''
      editAvatarVisible.value = false
      uni.showToast({ title: '头像更新成功', icon: 'none' })
    },
  })
}

function navigateTo(url: string) {
  if (!isLoggedIn()) {
    // 未登录用户依然允许访问页面（通过页面内部去登录卡片引导登录）
  }
  uni.navigateTo({ url })
}
</script>

<template>
  <view class="page-my safe-bottom-page--fixed-bar bg-[#F1DFC5] px-3 pt-3 space-y-4">
    <!-- 用户身份单层精质通行证卡片 (Design-Spec #D3BA9F Passport Hero Card) -->
    <view class="shadow-2xs overflow-hidden border border-[#B69171]/40 rounded-[18px] bg-[#D3BA9F] p-4.5 text-[#1E1E1E]">
      <view v-if="isLoggedIn()" class="space-y-2">
        <view class="flex items-center justify-between">
          <view class="flex items-center gap-3.5">
            <view class="relative cursor-pointer transition-transform active:scale-95" @click="openEditAvatar">
              <wd-img
                custom-class="h-16 w-16 rounded-full bg-[#D9D9D9] object-cover ring-2 ring-[#B69171] shadow-xs"
                :src="profileInfo?.avatar || userStore.userAvatar"
                lazy-load
                mode="aspectFill"
                round
                width="128rpx"
                height="128rpx"
              />
              <view class="shadow-xs absolute h-5 w-5 flex items-center justify-center rounded-full bg-[#F9DF95] text-[#1E1E1E] ring-1 ring-white -bottom-0.5 -right-0.5">
                <text class="i-carbon:camera text-3xs font-black" />
              </view>
            </view>

            <view class="space-y-1">
              <!-- 点击昵称直接弹出修改 -->
              <view class="inline-flex cursor-pointer items-center gap-1.5 active:opacity-75" @click="openEditNickname">
                <text class="text-xl text-[#1E1E1E] font-black tracking-tight">{{ profileInfo?.nickname || userStore.userInfo?.nickname }}</text>
                <wd-icon name="edit" size="14px" color="#756C5E" />
                <view class="shadow-2xs rounded-full bg-[#F9DF95] px-2.5 py-0.5 text-[10px] text-[#1E1E1E] font-black">
                  {{ (profileInfo?.isAdmin || userStore.userInfo?.isAdmin) ? '管理员' : `Level ${(profileInfo?.level || userStore.userInfo?.level || 1)}` }}
                </view>
              </view>
              <text class="block text-sm text-[#756C5E] font-bold font-numeric">ID: {{ profileInfo?.id || userStore.userInfo?.id || profileInfo?.netid || userStore.userInfo?.netid }}</text>
            </view>
          </view>
        </view>

        <!-- 总积分 (向上靠紧，留白缩减) -->
        <view class="flex items-center justify-end border-t border-[#B69171]/30 pt-1.5">
          <view class="flex cursor-pointer items-center gap-1 active:opacity-75" @click="navigateTo(AppRoute.MyPoints)">
            <text class="text-xs text-[#756C5E] font-medium">总积分:</text>
            <text class="ml-0.5 text-base text-[#1E1E1E] font-bold font-numeric">{{ profileInfo?.points ?? userStore.userInfo?.points ?? 0 }}</text>
          </view>
        </view>
      </view>

      <view v-else class="flex items-center justify-between py-1">
        <view class="flex items-center gap-3.5">
          <view class="shadow-xs h-12 w-12 flex items-center justify-center rounded-full bg-[#F9DF95] text-[#1E1E1E]">
            <wd-icon name="user" size="24px" color="#1E1E1E" />
          </view>
          <view>
            <text class="block text-lg text-[#1E1E1E] font-black">未登录账户</text>
            <text class="mt-0.5 block text-xs text-[#756C5E] font-bold">登录解锁校园机位与积分探索</text>
          </view>
        </view>
        <wd-button size="small" round type="warning" custom-class="!font-bold !bg-[#F9DF95] !text-[#1E1E1E] shadow-xs" @click="loginDirectly">
          去登录
        </wd-button>
      </view>
    </view>

    <!-- 功能列表：按 活动 / 积分 / 更多 3 大板块区分与呈现 -->
    <view class="space-y-4">
      <view
        v-for="group in menuGroups"
        :key="group.title"
        class="space-y-1"
      >
        <text class="block px-1 text-xs text-[#756C5E] font-black tracking-wider font-mono uppercase">
          {{ group.title }}
        </text>

        <view class="border-y border-[#B69171]">
          <view
            v-for="(item, index) in group.items"
            :key="item.title"
            class="flex cursor-pointer items-center justify-between py-3.5 transition-colors active:opacity-75"
            :class="index > 0 ? 'border-t border-[#B69171]' : ''"
            @click="navigateTo(item.route)"
          >
            <view class="flex items-center gap-3.5">
              <view class="h-8 w-8 flex items-center justify-center rounded-full bg-[#B69171]/15 text-[#B69171]">
                <text class="text-lg font-bold" :class="item.icon" />
              </view>
              <text class="text-sm text-[#1E1E1E] font-black tracking-tight">{{ item.title }}</text>
            </view>
            <wd-icon name="arrow-right" size="14px" color="#756C5E" />
          </view>
        </view>
      </view>
    </view>

    <!-- 退出登录按钮 -->
    <view v-if="isLoggedIn()" class="pt-2">
      <wd-button round block type="danger" size="large" custom-class="!font-bold shadow-xs" @click="handleLogout">
        退出登录
      </wd-button>
    </view>

    <!-- 修改昵称 Popup -->
    <wd-popup v-model="editNameVisible" position="center" custom-style="background: transparent; width: 88vw; max-width: 620rpx; overflow: visible;" @close="editNameVisible = false">
      <view class="box-border w-full border border-[#D3BA9F] rounded-[22px] bg-white p-5 shadow-xl space-y-4">
        <!-- 标题栏 -->
        <view class="flex items-center justify-between border-b border-[#D3BA9F]/30 pb-3">
          <view class="flex items-center gap-2">
            <view class="h-4 w-1.5 rounded-full bg-[#F9DF95]" />
            <text class="u-title-lg">修改个人昵称</text>
          </view>
          <wd-tag type="warning" round size="small" custom-class="!font-bold !bg-[#F9DF95]/50 !text-[#854D0E] !border-0">
            剩余 {{ profileInfo?.nicknameEditsRemaining ?? userStore.userInfo?.nicknameEditsRemaining ?? 0 }} 次
          </wd-tag>
        </view>

        <!-- 输入框 -->
        <view class="space-y-1">
          <text class="block text-xs text-[#756C5E] font-bold">新昵称</text>
          <wd-input
            v-model="newNickname"
            placeholder="请输入新昵称 (≤10字)"
            :maxlength="10"
            clearable
            custom-class="!bg-[#F8F6F2] !rounded-xl !p-3 !border !border-[#D3BA9F]/60"
          />
        </view>

        <!-- 操作按钮 -->
        <view class="flex gap-3 pt-1">
          <wd-button
            class="flex-1"
            round
            size="medium"
            custom-class="!bg-[#F8F6F2] !text-[#756C5E] !border !border-[#D3BA9F]/50 !font-bold"
            @click="editNameVisible = false"
          >
            取消
          </wd-button>
          <wd-button
            class="flex-1"
            round
            size="medium"
            custom-class="!bg-[#F9DF95] !text-[#1E1E1E] !font-black shadow-xs active:scale-95 transition-transform"
            :disabled="nicknameMutation.isPending.value"
            :loading="nicknameMutation.isPending.value"
            @click="confirmNickname"
          >
            保存修改
          </wd-button>
        </view>
      </view>
    </wd-popup>

    <!-- 修改头像 Popup -->
    <wd-popup v-model="editAvatarVisible" position="center" custom-style="background: transparent; width: 88vw; max-width: 620rpx; overflow: visible;" @close="editAvatarVisible = false">
      <view class="box-border w-full border border-[#D3BA9F] rounded-[22px] bg-white p-5 shadow-xl space-y-4">
        <!-- 标题栏 -->
        <view class="flex items-center justify-between border-b border-[#D3BA9F]/30 pb-3">
          <view class="flex items-center gap-2">
            <view class="h-4 w-1.5 rounded-full bg-[#F9DF95]" />
            <text class="u-title-lg">修改个人头像</text>
          </view>
          <wd-tag type="warning" round size="small" custom-class="!font-bold !bg-[#F9DF95]/50 !text-[#854D0E] !border-0">
            剩余 {{ profileInfo?.avatarEditsRemaining ?? userStore.userInfo?.avatarEditsRemaining ?? 0 }} 次
          </wd-tag>
        </view>

        <!-- 头像展示区 -->
        <view class="flex justify-center py-2">
          <view class="relative rounded-full p-1 ring-4 ring-[#F9DF95]/40">
            <wd-img
              lazy-load
              custom-class="h-22 w-22 rounded-full bg-[#F8F6F2] object-cover ring-2 ring-[#F9DF95] shadow-sm"
              :src="selectedAvatarPath || profileInfo?.avatar || userStore.userAvatar"
              mode="aspectFill"
              round
              width="176rpx"
              height="176rpx"
            />
          </view>
        </view>

        <!-- 操作区 -->
        <view class="space-y-2.5">
          <!-- #ifdef MP-WEIXIN -->
          <button class="m-0 w-full border-none bg-transparent p-0 outline-none" open-type="chooseAvatar" @chooseavatar="handleChooseAvatar">
            <wd-button round block size="medium" custom-class="!bg-[#F8F6F2] !text-[#1E1E1E] !border !border-[#D3BA9F]/60 !font-bold">
              <template #icon>
                <wd-icon name="picture" size="16px" custom-class="text-[#D97706]" />
              </template>
              微信快捷选图
            </wd-button>
          </button>
          <!-- #endif -->
          <wd-button round block size="medium" custom-class="!bg-[#F8F6F2] !text-[#1E1E1E] !border !border-[#D3BA9F]/60 !font-bold" @click="startChooseAvatar">
            <template #icon>
              <wd-icon name="picture" size="16px" custom-class="text-[#D97706]" />
            </template>
            选择图片
          </wd-button>

          <view class="flex gap-3 pt-1">
            <wd-button
              class="flex-1"
              round
              size="medium"
              custom-class="!bg-[#F8F6F2] !text-[#756C5E] !border !border-[#D3BA9F]/50 !font-bold"
              @click="editAvatarVisible = false"
            >
              取消
            </wd-button>
            <wd-button
              class="flex-1"
              round
              size="medium"
              custom-class="!bg-[#F9DF95] !text-[#1E1E1E] !font-black shadow-xs active:scale-95 transition-transform"
              :disabled="!selectedAvatarPath || avatarMutation.isPending.value"
              :loading="avatarMutation.isPending.value"
              @click="confirmUpdateAvatar"
            >
              确认修改
            </wd-button>
          </view>
        </view>
      </view>
    </wd-popup>
  </view>
</template>
