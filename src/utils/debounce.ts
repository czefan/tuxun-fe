export interface DebounceOptions {
  signal?: AbortSignal
  edges?: Array<'leading' | 'trailing'>
}

export interface DebouncedFunction<F extends (...args: any[]) => void> {
  (...args: Parameters<F>): void
  schedule: () => void
  cancel: () => void
  flush: () => void
}

export function debounce<F extends (...args: any[]) => void>(
  func: F,
  debounceMs: number,
  { signal, edges }: DebounceOptions = {},
): DebouncedFunction<F> {
  let pendingCall: { thisArg: any, args: Parameters<F> } | null = null

  const leading = edges != null && edges.includes('leading')
  const trailing = edges == null || edges.includes('trailing')

  const invoke = () => {
    if (pendingCall !== null) {
      func.apply(pendingCall.thisArg, pendingCall.args)
      pendingCall = null
    }
  }

  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const cancelTimer = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  const cancel = () => {
    cancelTimer()
    pendingCall = null
  }

  const onTimerEnd = () => {
    if (trailing) {
      invoke()
    }

    cancel()
  }

  const schedule = () => {
    if (timeoutId != null) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      timeoutId = null
      onTimerEnd()
    }, debounceMs)
  }

  const flush = () => {
    invoke()
  }

  const debounced = function (this: any, ...args: Parameters<F>) {
    if (signal?.aborted) {
      return
    }

    pendingCall = { thisArg: this, args }

    const isFirstCall = timeoutId == null

    schedule()

    if (leading && isFirstCall) {
      invoke()
    }
  }

  debounced.schedule = schedule
  debounced.cancel = cancel
  debounced.flush = flush

  signal?.addEventListener('abort', cancel, { once: true })

  return debounced
}
