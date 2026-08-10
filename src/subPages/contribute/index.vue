<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { createPhoto } from '@/features/photo/api'
import { useActiveActivities } from '@/features/activity/query'
import { smartCompressImage } from '@/utils/image-compress'
import { AppRoute } from '@/router/routes'

import { useAuth } from '@/composables/use-auth'
import { DEFAULT_COORD_TYPE, isSubmittableLocation } from '@/composables/use-map'

definePage({
  style: {
    navigationBarTitleText: '%page.contribute%',
  },
})

const { isLoggedIn, loginDirectly, requireLogin } = useAuth()

const form = reactive({
  activityId: 0,
  title: '',
  description: '',
  filePath: '',
  address: '',
  latitude: 0,
  longitude: 0,
  coordType: DEFAULT_COORD_TYPE as 'wgs84' | 'gcj02',
})

const DRAFT_KEY = 'tuxun_contribute_draft'
const { data: activityData } = useActiveActivities()

// 驳回回填时 filePath 是远端 URL，仅作预览，提交前必须重新选图
const isRemoteImage = computed(() => /^https?:\/\//i.test(form.filePath))

onLoad((options) => {
  if (!isLoggedIn())
    return
  // 不默认选中第一个活动：onLoad 时活动列表请求通常未返回，仅当查询已被缓存
  // （如投稿后 redirectTo 刷新自己）才会「碰巧」选中第一个——行为随缓存时序漂移。
  // 统一不选：首次进入与刷新后都是空白态「点击选择活动」，由用户显式选择。
  if (options?.refill) {
    try {
      const refillData = JSON.parse(decodeURIComponent(options.refill))
      Object.assign(form, refillData)
      return
    }
    catch {}
  }
  checkDraft()
})

function checkDraft() {
  const saved = uni.getStorageSync(DRAFT_KEY)
  if (saved) {
    uni.showModal({
      title: '恢复草稿',
      content: '检测到您上次有未完成的投稿草稿，是否恢复？',
      confirmText: '恢复',
      cancelText: '放弃',
      success: (res) => {
        if (res.confirm) {
          try {
            const parsed = JSON.parse(saved)
            Object.assign(form, parsed)
          }
          catch {}
        }
        else if (res.cancel) {
          uni.removeStorageSync(DRAFT_KEY)
        }
      },
    })
  }
}

watch(
  form,
  (newVal) => {
    if (newVal.title || newVal.filePath || newVal.address) {
      uni.setStorageSync(DRAFT_KEY, JSON.stringify(newVal))
    }
  },
  { deep: true },
)

function choosePhoto() {
  uni.chooseImage({
    count: 1,
    sizeType: ['original', 'compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        form.filePath = await smartCompressImage(res.tempFilePaths[0])
      }
    },
  })
}

function handleFileDrop(e: any) {
  // #ifdef H5
  e.preventDefault?.()
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      void smartCompressImage(url).then((path) => {
        form.filePath = path
      })
    }
    else {
      uni.showToast({ title: '请拖拽图片文件', icon: 'none' })
    }
  }
  // #endif
}

async function handleSubmit() {
  if (!requireLogin())
    return
  if (!form.activityId) {
    uni.showToast({ title: '请选择关联活动', icon: 'none' })
    return
  }
  if (!form.title.trim()) {
    uni.showToast({ title: '请输入题目标题', icon: 'none' })
    return
  }
  if (!form.filePath) {
    uni.showToast({ title: '请上传题目图片', icon: 'none' })
    return
  }
  if (/^https?:\/\//i.test(form.filePath)) {
    uni.showToast({ title: '请重新选择题目图片后再提交', icon: 'none' })
    return
  }
  if (!isSubmittableLocation(form.latitude, form.longitude)) {
    uni.showToast({ title: '请选择地点位置', icon: 'none' })
    return
  }

  try {
    await createPhoto({
      activityId: form.activityId,
      title: form.title.trim(),
      description: form.description.trim(),
      filePath: form.filePath,
      latitude: form.latitude,
      longitude: form.longitude,
      coordType: form.coordType,
    })

    uni.removeStorageSync(DRAFT_KEY)

    // 整页刷新：redirectTo 重开投稿页（全新实例，onLoad 重跑、地图组件重新初始化），
    // 而不是逐字段重置——逐字段容易漏掉组件内部状态（如地图草稿坐标）。
    uni.redirectTo({
      url: AppRoute.Contribute,
      success: () => {
        uni.showModal({
          title: '投稿成功',
          content: '您的题目已成功提交，可在「我的投稿」中查看审核状态。',
          showCancel: false,
          confirmText: '我知道了',
          confirmColor: '#B69171',
        })
      },
    })
  }
  catch {
    // Handled by request error interceptor
  }
}

const locationPickerRef = ref<{ locate: () => void, chooseLocation: () => void } | null>(null)
</script>

<template>
  <view class="page-contribute safe-bottom-page box-border min-h-screen bg-[#F1DFC5] px-4 pt-4">
    <!-- 未登录页面级提示卡片（与意见反馈/通知界面保持 100% 统一样式） -->
    <view v-if="!isLoggedIn()" class="min-h-[calc(100vh-120rpx)] flex flex-col items-center justify-center pb-12 -mt-12">
      <wd-empty icon="no-result" tip="登录后提交题目投稿" />
      <wd-button size="small" round type="warning" custom-class="!mt-4 !font-bold shadow-md" @click="loginDirectly">
        去登录
      </wd-button>
    </view>

    <!-- 已登录：完整投稿表单卡片 -->
    <view v-else class="space-y-4">
      <!-- 第一部分：文字部分 (Text Section) -->
      <view class="shadow-2xs border border-[#D3BA9F] rounded-[18px] bg-white p-4 space-y-3.5">
        <view class="flex items-center gap-2 border-b border-[#D3BA9F]/30 pb-2.5">
          <view class="h-4 w-1.5 rounded-full bg-[#B69171]" />
          <text class="text-base text-[#1E1E1E] font-black tracking-tight">文字信息</text>
        </view>

        <!-- wd-form 只负责标签与排版；必填与坐标校验仍在 handleSubmit 显式判断（见 location-guard 测试） -->
        <wd-form :model="form" custom-class="block space-y-3.5">
          <!-- 1. 选择活动 -->
          <view class="space-y-1.5">
            <text class="block text-xs text-[#756C5E] font-bold">
              选择关联活动 <text class="text-rose-500">*</text>
            </text>
            <picker
              :range="activityData?.list || []"
              range-key="title"
              @change="(e: any) => form.activityId = activityData?.list[e.detail.value]?.id || 0"
            >
              <view class="flex items-center justify-between border border-[#D3BA9F]/60 rounded-xl bg-[#F8F6F2] p-3 text-sm text-[#1E1E1E] font-bold transition-colors active:bg-[#EFECE6]">
                <text>{{ activityData?.list?.find(a => a.id === form.activityId)?.title || '点击选择活动' }}</text>
                <text class="i-carbon:chevron-down text-[#B69171]" />
              </view>
            </picker>
          </view>

          <!-- 2. 题目名称 -->
          <view class="space-y-1.5">
            <text class="block text-xs text-[#756C5E] font-bold">
              题目名称 <text class="text-rose-500">*</text>
            </text>
            <wd-input
              v-model="form.title"
              placeholder="例如：图书馆东门石雕 (≤20字)"
              :maxlength="20"
              clearable
              custom-class="!bg-[#F8F6F2] !rounded-xl !p-3 !border !border-[#D3BA9F]/60"
            />
          </view>

          <!-- 3. 题目线索描述 -->
          <view class="space-y-1.5">
            <text class="block text-xs text-[#756C5E] font-bold">
              题目线索描述 <text class="text-xs text-[#8A7E70] font-normal">(选填)</text>
            </text>
            <wd-textarea
              v-model="form.description"
              placeholder="描述地标周围特征 (≤50字)..."
              :maxlength="50"
              clearable
              custom-class="!bg-[#F8F6F2] !rounded-xl !p-3 !border !border-[#D3BA9F]/60"
            />
          </view>
        </wd-form>
      </view>

      <!-- 第二部分：图片部分 (Photo Section) -->
      <view class="shadow-2xs border border-[#D3BA9F] rounded-[18px] bg-white p-4 space-y-3">
        <view class="flex items-center justify-between border-b border-[#D3BA9F]/30 pb-2.5">
          <view class="flex items-center gap-2">
            <view class="h-4 w-1.5 rounded-full bg-[#B69171]" />
            <text class="text-base text-[#1E1E1E] font-black tracking-tight">
              图片 <text class="text-rose-500">*</text>
            </text>
          </view>
        </view>

        <view
          class="relative h-48 w-full flex flex-col cursor-pointer items-center justify-center overflow-hidden border-2 border-[#D3BA9F] rounded-2xl border-dashed bg-[#F8F6F2] transition-colors active:bg-[#EFECE6]"
          @tap="choosePhoto"
          @dragover.prevent
          @drop.prevent="handleFileDrop"
        >
          <wd-img
            v-if="form.filePath"
            custom-class="h-full w-full object-cover"
            :src="form.filePath"
            lazy-load
            mode="aspectFill"
            width="100%"
            height="100%"
          />
          <view v-else class="flex flex-col items-center p-3 text-center space-y-1.5">
            <view class="shadow-2xs h-12 w-12 flex items-center justify-center rounded-full bg-[#F9DF95] text-[#1E1E1E]">
              <text class="i-carbon:cloud-upload text-2xl font-black" />
            </view>
            <text class="block text-sm text-[#1E1E1E] font-black">
              点击选择 或 拖拽上传图片
            </text>
            <text class="block text-xs text-[#756C5E] font-bold">
              支持 JPG / PNG 原图（建议清晰无遮挡）
            </text>
          </view>

          <view v-if="form.filePath" class="shadow-xs absolute right-3.5 top-3.5 z-1 flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-white backdrop-blur-md">
            <text class="i-carbon:renew text-xs" />
            <text class="text-xs font-bold">重新选择</text>
          </view>
        </view>
        <text v-if="isRemoteImage" class="block text-center text-xs text-amber-600 font-bold">
          已回填原图预览，重新提交请点击图片重新选取
        </text>
      </view>

      <!-- 第三部分：位置部分 (Location Section) -->
      <view class="shadow-2xs border border-[#D3BA9F] rounded-[18px] bg-white p-4 space-y-3">
        <view class="flex items-center justify-between border-b border-[#D3BA9F]/30 pb-2.5">
          <view class="flex items-center gap-2">
            <view class="h-4 w-1.5 rounded-full bg-[#B69171]" />
            <text class="text-base text-[#1E1E1E] font-black tracking-tight">
              位置 <text class="text-rose-500">*</text>
            </text>
          </view>
          <view class="flex items-center gap-3">
            <view
              class="flex cursor-pointer items-center gap-1 text-sm text-[#B69171] font-bold transition-opacity active:opacity-70"
              @click="locationPickerRef?.locate()"
            >
              <text class="i-carbon:location text-sm text-[#B69171]" />
              <text>定位</text>
            </view>
            <!-- #ifndef H5 -->
            <!-- H5 端无全屏选点：uni-h5 系统弹窗确认需先选 POI 列表项，高德安全密钥模式下列表加载失败；小程序端为微信原生弹窗，无此限制 -->
            <view
              class="flex cursor-pointer items-center gap-1 text-sm text-[#756C5E] font-medium transition-opacity active:opacity-70"
              @click="locationPickerRef?.chooseLocation()"
            >
              <text class="i-carbon:map text-sm text-[#756C5E]" />
              <text>全屏</text>
            </view>
            <!-- #endif -->
          </view>
        </view>

        <form-location-picker
          ref="locationPickerRef"
          v-model:latitude="form.latitude"
          v-model:longitude="form.longitude"
          v-model:address="form.address"
          selected-text="已选择地标坐标"
        />
      </view>

      <!-- 第四部分：提交投稿按钮 (Submit Section) -->
      <view class="pt-2">
        <wd-button
          type="warning"
          round
          block
          size="large"
          custom-class="!font-black !bg-[#B69171] !text-white !border-0 shadow-md active:scale-[0.99] transition-transform"
          @click="handleSubmit"
        >
          提交投稿
        </wd-button>
      </view>
    </view>
  </view>
</template>
