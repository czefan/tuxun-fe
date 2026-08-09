import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'

const store = createPinia()

store.use(
  createPersistedState({
    storage: {
      getItem: (key: string) => uni.getStorageSync(key),
      setItem: (key: string, value: string) => uni.setStorageSync(key, value),
    },
  }),
)

export default store
