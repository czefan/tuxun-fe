import { onScopeDispose } from 'vue'
import { debounce } from '@/utils/debounce'
import type { DebouncedFunction, DebounceOptions } from '@/utils/debounce'

type TimeoutId = ReturnType<typeof setTimeout>
type IntervalId = ReturnType<typeof setInterval>
type TimerCallback = () => void

export interface UseTimerReturn {
  setTimeout: (callback: TimerCallback, delay?: number) => TimeoutId
  clearTimeout: (timerId: TimeoutId) => void
  setInterval: (callback: TimerCallback, delay?: number) => IntervalId
  clearInterval: (timerId: IntervalId) => void
  clearAll: () => void
}

/**
 * Scope-bound timer helpers. Timers are cleared automatically when the current
 * Vue effect scope/component is disposed.
 */
export function useTimer(): UseTimerReturn {
  const timeouts = new Set<TimeoutId>()
  const intervals = new Set<IntervalId>()

  const clearTimeoutById = (timerId: TimeoutId) => {
    clearTimeout(timerId)
    timeouts.delete(timerId)
  }

  const clearIntervalById = (timerId: IntervalId) => {
    clearInterval(timerId)
    intervals.delete(timerId)
  }

  const setScopeTimeout = (callback: TimerCallback, delay = 0) => {
    const timerId = setTimeout(() => {
      timeouts.delete(timerId)
      callback()
    }, delay)

    timeouts.add(timerId)
    return timerId
  }

  const setScopeInterval = (callback: TimerCallback, delay = 0) => {
    const timerId = setInterval(callback, delay)
    intervals.add(timerId)
    return timerId
  }

  const clearAll = () => {
    timeouts.forEach(timerId => clearTimeout(timerId))
    intervals.forEach(timerId => clearInterval(timerId))
    timeouts.clear()
    intervals.clear()
  }

  onScopeDispose(clearAll)

  return {
    setTimeout: setScopeTimeout,
    clearTimeout: clearTimeoutById,
    setInterval: setScopeInterval,
    clearInterval: clearIntervalById,
    clearAll,
  }
}

export function useDebounceFn<F extends (...args: any[]) => void>(
  func: F,
  debounceMs: number,
  options?: DebounceOptions,
): DebouncedFunction<F> {
  const debounced = debounce(func, debounceMs, options)

  onScopeDispose(() => {
    debounced.cancel()
  })

  return debounced
}
