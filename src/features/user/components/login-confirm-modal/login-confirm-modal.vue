<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { redirectToOAuth } from '@/service/auth/login'
import { useAuthStore } from '@/store/auth'
import { getUserInfo, testLogin } from '../../api'
import { useUserStore } from '../../store/user'

defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}>()

const isMock = ref(import.meta.env.VITE_ENABLE_MOCK === 'true' || import.meta.env.VITE_ENABLE_MOCK === 'Y')
const isDev = ref(import.meta.env.DEV || isMock.value)

const currentScenario = ref<'data' | 'empty'>('data')
const testUserId = ref<number | string>(1)
const testPassword = ref('')
const loading = ref(false)

onMounted(async () => {
  if (isMock.value) {
    try {
      const { getCurrentMockScenario } = await import('@/mocks')
      const sc = await getCurrentMockScenario()
      currentScenario.value = sc === 'empty' ? 'empty' : 'data'
    }
    catch {}
  }
})

async function handleSwitchScenario(val: 'data' | 'empty') {
  currentScenario.value = val
  const { switchMockScenario } = await import('@/mocks')
  await switchMockScenario(val)
  uni.showToast({ title: `已切换 Mock 切档: ${val}`, icon: 'none' })
}

async function handleTestLogin() {
  const userIdNum = isMock.value ? 1 : Number(testUserId.value)
  if (!isMock.value && (!userIdNum || Number.isNaN(userIdNum))) {
    uni.showToast({ title: '请输入要登录的用户 ID', icon: 'none' })
    return
  }

  loading.value = true
  try {
    const userStore = useUserStore()
    const result = await testLogin(userIdNum, isMock.value ? '' : String(testPassword.value || ''))
    if (result?.sessionId) {
      useAuthStore().setSessionId(result.sessionId)
    }
    const fullInfo = await getUserInfo()
    userStore.setUserInfo(fullInfo)
    uni.showToast({ title: '测试登录成功', icon: 'success' })
    emit('update:modelValue', false)
    emit('success')
  }
  catch (err) {
    console.error('Test login failed:', err)
    uni.showToast({ title: '登录失败', icon: 'none' })
  }
  finally {
    loading.value = false
  }
}

function handleOAuthLogin() {
  redirectToOAuth()
}

function handleClose() {
  emit('update:modelValue', false)
}
</script>

<template>
  <wd-popup
    :model-value="modelValue"
    position="center"
    :z-index="1000"
    :lock-scroll="true"
    custom-style="background: transparent; width: 84vw; max-width: 600rpx;"
    @close="handleClose"
  >
    <view class="box-border w-full border border-[#D3BA9F] rounded-[24px] bg-[#F1DFC5] p-6 shadow-2xl space-y-4" @touchmove.stop.prevent>
      <view class="flex items-center justify-between border-b border-[#D3BA9F]/40 pb-3">
        <text class="u-title-lg">{{ isDev ? '开发调试与登录确认' : '统一身份认证登录' }}</text>
        <wd-icon name="close" size="20px" custom-class="cursor-pointer text-[#756C5E]" @click="handleClose" />
      </view>

      <view v-if="isMock || !isDev" class="text-sm text-[#756C5E] font-medium leading-relaxed">
        <template v-if="isMock">
          当前处于 Mock 测试模式，您可进行快捷一键登录或选择 Mock 切档。
        </template>
        <template v-else>
          您即将前往学校统一身份认证系统进行身份绑定与登录，是否继续？
        </template>
      </view>

      <!-- Mock 模式专属切档选项卡组 -->
      <view v-if="isMock" class="rounded-xl bg-[#E6D4BB]/60 p-3 space-y-2.5">
        <text class="block text-xs text-[#8A7E70] font-bold">🎛️ Mock 数据场景模式切档：</text>
        <view class="flex items-center justify-center gap-2">
          <view
            class="flex-1 cursor-pointer border rounded-lg py-1.5 text-center text-xs transition-all active:scale-95"
            :class="currentScenario === 'data' ? 'bg-[#B69171] text-white font-bold border-[#B69171] shadow-xs' : 'bg-white/60 text-[#756C5E] border-[#D3BA9F]'"
            @click="handleSwitchScenario('data')"
          >
            有数据 (35+条)
          </view>
          <view
            class="flex-1 cursor-pointer border rounded-lg py-1.5 text-center text-xs transition-all active:scale-95"
            :class="currentScenario === 'empty' ? 'bg-[#B69171] text-white font-bold border-[#B69171] shadow-xs' : 'bg-white/60 text-[#756C5E] border-[#D3BA9F]'"
            @click="handleSwitchScenario('empty')"
          >
            无数据 (0条)
          </view>
        </view>
      </view>

      <!-- 非 Mock 开发模式输入账号表单 -->
      <view v-else-if="isDev" class="rounded-xl bg-[#E6D4BB]/60 p-3 space-y-2">
        <text class="block text-xs text-[#8A7E70] font-bold">🔑 测试账号接口登录：</text>
        <view class="space-y-2">
          <wd-input
            v-model="testUserId"
            type="number"
            placeholder="请输入测试用户 ID (如: 1)"
            no-border
            custom-class="!bg-white/80 !rounded-lg !px-2.5 !py-1 text-xs"
          />
          <wd-input
            v-model="testPassword"
            type="password"
            placeholder="测试登录密码"
            no-border
            custom-class="!bg-white/80 !rounded-lg !px-2.5 !py-1 text-xs"
          />
        </view>
      </view>

      <!-- 按钮操作区 -->
      <view class="pt-1 space-y-2">
        <wd-button
          v-if="isDev"
          round
          block
          type="warning"
          size="medium"
          custom-class="!font-bold !bg-[#B69171] !text-white shadow-xs"
          :loading="loading"
          @click="handleTestLogin"
        >
          {{ isMock ? '开发测试一键登录' : '测试账号直接登录' }}
        </wd-button>

        <wd-button
          round
          block
          :type="isDev ? 'info' : 'warning'"
          size="medium"
          custom-class="!font-bold !text-sm"
          @click="handleOAuthLogin"
        >
          {{ isDev ? '前往统一身份认证' : '前往统一身份认证登录' }}
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>
