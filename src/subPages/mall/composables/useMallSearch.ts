import { computed, ref } from 'vue'
import { productList } from '../features'

export function useMallSearch() {
  const searchVisible = ref(false)
  const searchKeyword = ref('')

  const visibleProducts = computed(() => {
    const keyword = searchKeyword.value.trim().toLowerCase()

    if (!keyword) {
      return productList
    }

    return productList.filter(item =>
      [item.title, item.desc, item.stockText, item.badge ?? '', `${item.points}`].some(value =>
        value.toLowerCase().includes(keyword),
      ),
    )
  })

  const list1 = computed(() => visibleProducts.value.filter((_, index) => index % 2 === 0))
  const list2 = computed(() => visibleProducts.value.filter((_, index) => index % 2 === 1))

  function goSearch() {
    searchVisible.value = true
  }

  function handleSearch(keyword: string) {
    searchKeyword.value = keyword
  }

  function clearSearch() {
    searchKeyword.value = ''
  }

  return {
    searchVisible,
    searchKeyword,
    visibleProducts,
    list1,
    list2,
    goSearch,
    handleSearch,
    clearSearch,
  }
}
