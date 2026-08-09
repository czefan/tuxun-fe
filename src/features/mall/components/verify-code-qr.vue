<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import qrcode from 'qrcode-generator'

const props = defineProps<{
  verifyCode: string
  goodName: string
}>()

const emit = defineEmits<{
  (event: 'close'): void
}>()

const pureQrUrl = computed(() => {
  if (!props.verifyCode)
    return ''
  const qr = qrcode(0, 'H')
  qr.addData(props.verifyCode)
  qr.make()
  return qr.createDataURL(8, 4)
})

const compositeUrl = ref('')

watchEffect(() => {
  if (!props.verifyCode)
    return

  // 合成图依赖 canvas 2D API，只有 H5 有 document
  if (typeof document === 'undefined')
    return

  const qr = qrcode(0, 'H')
  qr.addData(props.verifyCode)
  qr.make()
  const count = qr.getModuleCount()

  const cvs = document.createElement('canvas')
  cvs.width = 480
  cvs.height = 560
  const ctx = cvs.getContext('2d')
  if (!ctx)
    return

  // 绘制背景与标题
  ctx.fillStyle = '#FFF'
  ctx.fillRect(0, 0, 480, 560)
  ctx.textAlign = 'center'
  ctx.fillStyle = '#1E1E1E'
  ctx.font = 'bold 24px sans-serif'
  ctx.fillText(props.goodName, 240, 50)
  ctx.fillStyle = '#756C5E'
  ctx.font = '15px sans-serif'
  ctx.fillText('向现场工作人员出示防伪码或扫码核销', 240, 85)

  // 绘制二维码点阵
  const size = 280
  const cell = size / count
  const startX = (480 - size) / 2
  const startY = 115
  ctx.fillStyle = '#000'
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.isDark(r, c)) {
        ctx.fillRect(Math.floor(startX + c * cell), Math.floor(startY + r * cell), Math.ceil(cell), Math.ceil(cell))
      }
    }
  }

  // 绘制防伪码框与文本
  ctx.fillStyle = '#F5F5F4'
  ctx.fillRect(50, 425, 380, 95)
  ctx.fillStyle = '#A8A29E'
  ctx.font = '14px sans-serif'
  ctx.fillText('核销防伪码', 240, 460)
  ctx.fillStyle = '#1C1917'
  ctx.font = 'bold 26px monospace'
  ctx.fillText(props.verifyCode, 240, 498)

  compositeUrl.value = cvs.toDataURL('image/png')
})

function copyCode() {
  uni.setClipboardData({
    data: props.verifyCode,
    success: () => uni.showToast({ title: '核销码已复制', icon: 'success' }),
  })
}
</script>

<template>
  <view class="relative mx-auto box-border w-full flex flex-col items-center gap-2.5 overflow-hidden border border-[#D3BA9F] rounded-2xl bg-white p-5 shadow-2xl">
    <!-- 关闭按钮 -->
    <view class="absolute right-3 top-3 z-10 h-7 w-7 flex cursor-pointer items-center justify-center rounded-full bg-stone-100 text-stone-500 active:scale-90" @tap="emit('close')">
      <wd-icon name="close" size="14px" />
    </view>

    <!-- 顶栏标题 -->
    <text class="px-4 text-center text-base text-gray-900 font-bold">{{ goodName }}</text>
    <text class="text-xs text-gray-500">向现场工作人员出示防伪码或扫码核销</text>

    <!-- 二维码展现区 (展示纯黑白，长按保存合成全套图) -->
    <view class="my-1 flex flex-col items-center gap-1">
      <view class="relative overflow-hidden border-4 border-white rounded-xl bg-white p-1 shadow-sm">
        <image v-if="pureQrUrl" :src="pureQrUrl" mode="aspectFit" class="pointer-events-none block h-44 w-44" />
        <image v-if="compositeUrl" :src="compositeUrl" show-menu-by-longpress mode="aspectFill" class="absolute inset-0 h-full w-full opacity-0" />
      </view>
      <text v-if="compositeUrl" class="text-[10px] text-stone-400 font-medium">长按二维码保存至相册</text>
    </view>

    <!-- 核销防伪码 -->
    <view class="relative box-border w-full cursor-pointer rounded-xl bg-stone-100 px-8 py-2.5 text-center active:opacity-85" @tap="copyCode">
      <text class="block text-xs text-stone-400 font-medium">核销防伪码</text>
      <text class="mt-0.5 block text-base text-stone-900 font-bold tracking-widest font-mono">{{ verifyCode }}</text>
      <view class="absolute right-3 top-1/2 h-8 w-8 flex items-center justify-center rounded-lg bg-[#B69171]/10 text-[#B69171] -translate-y-1/2 active:scale-90" @tap.stop="copyCode">
        <text class="i-carbon:copy text-base" />
      </view>
    </view>
  </view>
</template>
