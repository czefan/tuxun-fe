import { onScopeDispose, watch } from 'vue'
import type { WatchSource } from 'vue'
import { releaseObjectUrl } from '@/utils/object-url'

/** 只释放当前页面使用的 blob URL，不触碰远端地址与小程序文件。 */
export function useMediaResource(source: WatchSource<string>) {
  let current = ''
  let disposed = false
  let selectionVersion = 0
  watch(
    source,
    (value) => {
      if (current !== value) releaseObjectUrl(current)
      current = value
    },
    { immediate: true, flush: 'sync' },
  )
  onScopeDispose(() => {
    disposed = true
    releaseObjectUrl(current)
  })
  return {
    beginSelection() {
      return ++selectionVersion
    },
    accept(path: string, version = selectionVersion) {
      if (!disposed && version === selectionVersion) return true
      if (path !== current || disposed) releaseObjectUrl(path)
      return false
    },
  }
}
