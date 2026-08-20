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
const isAudit = ref(import.meta.env.VITE_SHOW_AUDIT_LOGIN === 'true')
const showTestLogin = ref(import.meta.env.DEV || isMock.value || isAudit.value)

const currentScenario = ref<'data' | 'empty'>('data')
const testNetid = ref('')
const testPassword = ref('')
const loading = ref(false)

onMounted(async () => {
  if (isMock.value) {
    try {
      const { getCurrentMockScenario } = await import('@/mocks')
      const sc = await getCurrentMockScenario()
      currentScenario.value = sc === 'empty' ? 'empty' : 'data'
    }
    catch {
      // 场景状态读取异常时默认使用 data 档
    }
  }
})

async function handleSwitchScenario(val: 'data' | 'empty') {
  currentScenario.value = val
  const { switchMockScenario } = await import('@/mocks')
  await switchMockScenario(val)
  uni.showToast({ title: `已切换 Mock 切档: ${val}`, icon: 'none' })
}

async function handleTestLogin() {
  const netid = isMock.value
    ? (String(testNetid.value || '').trim() || '20260001')
    : String(testNetid.value || '').trim()
  if (!isMock.value && !netid) {
    uni.showToast({ title: '请输入要登录用户的 NetID', icon: 'none' })
    return
  }

  loading.value = true
  try {
    const userStore = useUserStore()
    const result = await testLogin(netid, isMock.value ? '' : String(testPassword.value || ''))
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
  emit('update:modelValue', false)
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
    <view class="box-border w-full border border-tx-border rounded-[24px] bg-tx-main p-6 shadow-2xl space-y-4" @touchmove.stop.prevent>
      <view class="flex items-center justify-between border-b border-tx-border/40 pb-3">
        <text class="u-title-lg">{{ showTestLogin ? '开发调试与登录确认' : '统一身份认证登录' }}</text>
        <wd-icon name="close" size="20px" custom-class="cursor-pointer text-tx-ink-2" @click="handleClose" />
      </view>

      <view v-if="isMock || !showTestLogin" class="text-sm text-tx-ink-2 font-medium leading-relaxed">
        <template v-if="isMock">
          当前处于 Mock 测试模式，您可进行快捷一键登录或选择 Mock 切档。
        </template>
        <template v-else>
          您即将前往学校统一身份认证系统进行身份绑定与登录，是否继续？
        </template>
      </view>

      <!-- Mock 模式专属切档选项卡组 -->
      <view v-if="isMock" class="rounded-xl bg-[#E6D4BB]/60 p-3 space-y-2.5">
        <text class="block text-xs text-tx-ink-3 font-bold">🎛️ Mock 数据场景模式切档：</text>
        <view class="flex items-center justify-center gap-2">
          <view
            class="flex-1 cursor-pointer border rounded-lg py-1.5 text-center text-xs transition-all active:scale-95"
            :class="currentScenario === 'data' ? 'bg-tx-brown text-white font-bold border-tx-brown shadow-xs' : 'bg-white/60 text-tx-ink-2 border-tx-border'"
            @click="handleSwitchScenario('data')"
          >
            有数据 (35+条)
          </view>
          <view
            class="flex-1 cursor-pointer border rounded-lg py-1.5 text-center text-xs transition-all active:scale-95"
            :class="currentScenario === 'empty' ? 'bg-tx-brown text-white font-bold border-tx-brown shadow-xs' : 'bg-white/60 text-tx-ink-2 border-tx-border'"
            @click="handleSwitchScenario('empty')"
          >
            无数据 (0条)
          </view>
        </view>
      </view>

      <!-- 非 Mock 开发/提审模式输入账号表单 -->
      <view v-else-if="showTestLogin" class="rounded-xl bg-[#E6D4BB]/60 p-3 space-y-2">
        <text class="block text-xs text-tx-ink-3 font-bold">🔑 测试账号接口登录：</text>
        <view class="space-y-2">
          <wd-input
            v-model="testNetid"
            type="text"
            placeholder="请输入测试 NetID"
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
          v-if="showTestLogin"
          round
          block
          type="warning"
          size="medium"
          custom-class="!font-bold !bg-tx-brown !text-white shadow-xs"
          :loading="loading"
          @click="handleTestLogin"
        >
          {{ isMock ? '开发测试一键登录' : '测试账号直接登录' }}
        </wd-button>

        <wd-button
          round
          block
          :type="showTestLogin ? 'info' : 'warning'"
          size="medium"
          custom-class="!font-bold !text-sm"
          @click="handleOAuthLogin"
        >
          {{ showTestLogin ? '前往统一身份认证' : '前往统一身份认证登录' }}
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>
