/**
 * 微信小程序运行时缺失 Web 标准 AbortController / AbortSignal。
 *
 * @tanstack/query-core 在 Query.fetch() 内部（queryFn 被调用前）实例化 `new AbortController()`，
 * 若缺失会导致所有 query 查询在发起请求前直接抛出 ReferenceError，列表与数据请求完全静默失败。
 */

// #ifndef H5
if (typeof AbortController === 'undefined') {
  class MiniAbortSignal {
    aborted = false
    reason: unknown = undefined
    onabort: ((this: MiniAbortSignal, ev: { type: string, target: MiniAbortSignal }) => void) | null = null
    private listeners: Array<{ fn: (evt: { type: string, target: MiniAbortSignal }) => void, once: boolean }> = []

    addEventListener(
      event: string,
      fn: (evt: { type: string, target: MiniAbortSignal }) => void,
      options?: { once?: boolean },
    ) {
      if (event !== 'abort' || typeof fn !== 'function') {
        return
      }
      this.listeners.push({ fn, once: Boolean(options?.once) })
    }

    removeEventListener(event: string, fn: (evt: { type: string, target: MiniAbortSignal }) => void) {
      if (event !== 'abort') {
        return
      }
      this.listeners = this.listeners.filter(item => item.fn !== fn)
    }

    dispatchEvent(evt?: { type: string, target: MiniAbortSignal }) {
      const event = evt || { type: 'abort', target: this }
      if (typeof this.onabort === 'function') {
        this.onabort(event)
      }
      const toExecute = [...this.listeners]
      this.listeners = this.listeners.filter(item => !item.once)
      toExecute.forEach((item) => {
        item.fn(event)
      })
      return true
    }

    throwIfAborted() {
      if (this.aborted) {
        throw this.reason !== undefined ? this.reason : new Error('This operation was aborted')
      }
    }

    static abort(reason?: unknown) {
      const signal = new MiniAbortSignal()
      signal.aborted = true
      signal.reason = reason !== undefined ? reason : new Error('This operation was aborted')
      return signal
    }

    static timeout(delay: number) {
      const signal = new MiniAbortSignal()
      setTimeout(() => {
        if (!signal.aborted) {
          signal.aborted = true
          signal.reason = new Error('The operation was aborted due to timeout')
          signal.dispatchEvent()
        }
      }, delay)
      return signal
    }
  }

  class MiniAbortController {
    signal = new MiniAbortSignal()

    abort(reason?: unknown) {
      if (!this.signal.aborted) {
        this.signal.aborted = true
        this.signal.reason = reason !== undefined ? reason : new Error('This operation was aborted')
        this.signal.dispatchEvent()
      }
    }
  }

  const globalScope: Record<string, unknown>
    = typeof globalThis !== 'undefined'
      ? (globalThis as unknown as Record<string, unknown>)
      : typeof window !== 'undefined'
        ? (window as unknown as Record<string, unknown>)
        : {}

  globalScope.AbortController = MiniAbortController
  globalScope.AbortSignal = MiniAbortSignal
}
// #endif

export {}
