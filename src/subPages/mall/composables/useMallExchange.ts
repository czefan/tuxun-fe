import type { Ref } from 'vue'
import { computed, ref } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { usePrivateList } from '@/composables/usePrivateList'
import { useTimer } from '@/composables/useTimer'
import { BRAND_PRIMARY_COLOR } from '@/styles/constants'
import {
  canExchangeProduct,
  exchangeList,
} from '../features'
import type { ExchangeRecord, ProductItem } from '../features'

interface UseMallExchangeOptions {
  searchKeyword: Ref<string>
  switchTab: (index: number) => void
}

export function useMallExchange(options: UseMallExchangeOptions) {
  const { ensureLogin } = useAuth()
  const timer = useTimer()

  const exchangeVisible = ref(false)
  const selectedProduct = ref<ProductItem | null>(null)
  const exchangeCount = ref(1)
  const exchangeRecords = ref<ExchangeRecord[]>(exchangeList)

  const { list: visibleExchangeRecords, emptyText: exchangeRecordsEmptyText } = usePrivateList(
    () => {
      const keyword = options.searchKeyword.value.trim().toLowerCase()

      if (!keyword) {
        return exchangeRecords.value
      }

      return exchangeRecords.value.filter(record =>
        [record.title, record.time, record.status, record.exchangeCode ?? ''].some(value =>
          value.toLowerCase().includes(keyword),
        ),
      )
    },
    '暂无相关兑换记录',
  )

  const totalPoints = computed(() => {
    if (!selectedProduct.value) {
      return 0
    }

    return selectedProduct.value.points * exchangeCount.value
  })

  const maxStock = computed(() => {
    if (!selectedProduct.value) {
      return 99
    }

    const match = selectedProduct.value.stockText.match(/库存\s*(\d+)/)
    if (match) {
      return Number.parseInt(match[1], 10)
    }

    return 99
  })

  async function handleExchangeTap(item: ProductItem) {
    if (!canExchangeProduct(item)) {
      uni.showToast({
        title: '商品暂不可兑换',
        icon: 'none',
      })
      return
    }

    if (!(await ensureLogin())) {
      return
    }

    openExchangeDrawer(item)
  }

  function openExchangeDrawer(item: ProductItem) {
    selectedProduct.value = item
    exchangeCount.value = 1
    exchangeVisible.value = true
  }

  function closeExchange() {
    exchangeVisible.value = false
  }

  function adjustCount(delta: number) {
    const target = exchangeCount.value + delta
    if (target >= 1 && target <= maxStock.value) {
      exchangeCount.value = target
    }
  }

  function onStepperBlur() {
    let val = Math.floor(exchangeCount.value)
    if (Number.isNaN(val) || val < 1) {
      val = 1
    }
    if (val > maxStock.value) {
      val = maxStock.value
    }
    exchangeCount.value = val
  }

  function copyText(text: string) {
    uni.setClipboardData({
      data: text,
      success: () => {
        uni.showToast({
          title: '核销码已复制',
          icon: 'success',
        })
      },
    })
  }

  function confirmExchange() {
    if (!selectedProduct.value) {
      return
    }

    uni.showModal({
      title: '确认兑换',
      content: `确定要消耗 ${totalPoints.value} 积分兑换 ${exchangeCount.value} 件 "${selectedProduct.value.title}" 吗？`,
      cancelText: '取消',
      confirmText: '确定',
      confirmColor: BRAND_PRIMARY_COLOR,
      success: (res) => {
        if (!res.confirm || !selectedProduct.value) {
          return
        }

        const newRecord: ExchangeRecord = {
          id: `ex-${Date.now()}`,
          productId: selectedProduct.value.id,
          title: selectedProduct.value.title,
          cover: selectedProduct.value.cover,
          points: selectedProduct.value.points,
          count: exchangeCount.value,
          totalPoints: totalPoints.value,
          time: formatCurrentTime(),
          status: 'pending',
          exchangeCode: `TX-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        }
        exchangeRecords.value = [newRecord, ...exchangeRecords.value]

        uni.showToast({
          title: '兑换成功',
          icon: 'success',
        })
        exchangeVisible.value = false

        timer.setTimeout(() => {
          options.switchTab(1)
        }, 800)
      },
    })
  }

  return {
    exchangeVisible,
    selectedProduct,
    exchangeCount,
    visibleExchangeRecords,
    exchangeRecordsEmptyText,
    totalPoints,
    maxStock,
    handleExchangeTap,
    closeExchange,
    adjustCount,
    onStepperBlur,
    copyText,
    confirmExchange,
  }
}

function formatCurrentTime() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${hh}:${mm}`
}
