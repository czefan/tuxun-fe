import { ref } from 'vue'

export type MallTabKey = 'products' | 'records'

interface SwiperChangeEvent {
  detail: {
    current: number
  }
}

export function useMallTabs() {
  const tabs: Array<{ key: MallTabKey, title: string }> = [
    { key: 'products', title: '商品' },
    { key: 'records', title: '兑换记录' },
  ]
  const activeTab = ref<MallTabKey>('products')
  const currentTab = ref(0)

  function switchTab(index: number) {
    const tab = tabs[index]

    if (!tab) {
      return
    }

    currentTab.value = index
    activeTab.value = tab.key
  }

  function onTabChange(_key: string, index: number) {
    switchTab(index)
  }

  function onSwiperChange(e: SwiperChangeEvent) {
    switchTab(e.detail.current)
  }

  return {
    tabs,
    activeTab,
    currentTab,
    switchTab,
    onTabChange,
    onSwiperChange,
  }
}
