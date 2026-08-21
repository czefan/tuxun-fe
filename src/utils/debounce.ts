export interface DebouncedFunction<F extends (...args: any[]) => void> {
  (...args: Parameters<F>): void
  cancel: () => void
}

export function debounce<F extends (...args: any[]) => void>(
  fn: F,
  wait: number,
): DebouncedFunction<F> {
  let timer: ReturnType<typeof setTimeout> | null = null

  const debounced = function (this: any, ...args: Parameters<F>) {
    if (timer !== null) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      timer = null
      fn.apply(this, args)
    }, wait)
  }

  debounced.cancel = () => {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  return debounced
}
