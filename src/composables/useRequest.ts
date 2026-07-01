import type { Ref } from 'vue'
import { ref } from 'vue'

type MutateInput<T> = T | undefined | ((current: T | undefined) => T | undefined)
type CacheReadResult<T> = { hit: true, data: T } | { hit: false }

const DEFAULT_REQUEST_CACHE_TIME = 5 * 60 * 1000
const requestCache = new Map<string, { data: unknown, expiresAt: number }>()
const pendingRequests = new Map<string, Promise<unknown>>()

export type RequestCacheKey = string | readonly unknown[] | Record<string, unknown>

export interface RequestCacheOptions<P = undefined> {
  /** 缓存 key；相同 key 会复用缓存并合并并发请求 */
  key: RequestCacheKey | ((args: P | undefined) => RequestCacheKey | false | null | undefined)
  /** 缓存有效期，单位 ms；默认 5 分钟。设置为 0 可只做并发去重。 */
  cacheTime?: number
  /** 是否合并同 key 的并发请求，默认 true */
  dedupe?: boolean
}

export interface UseRequestOptions<T, P = undefined> {
  /** 是否立即执行 */
  immediate?: boolean
  /** 初始化数据 */
  initialData?: T
  /** immediate/refresh 未显式传参时使用的默认参数 */
  defaultParams?: P
  /** 请求成功回调 */
  onSuccess?: (data: T, args: P | undefined) => void
  /** 请求失败回调 */
  onError?: (error: Error, args: P | undefined) => void
  /** 服务端状态缓存；默认关闭，需要按接口显式开启 */
  cache?: false | RequestCacheOptions<P>
}

export interface UseRequestReturn<T, P = undefined> {
  loading: Ref<boolean>
  error: Ref<false | Error>
  data: Ref<T | undefined>
  run: (args?: P) => Promise<T | undefined>
  refresh: () => Promise<T | undefined>
  reset: () => void
  mutate: (input: MutateInput<T>) => T | undefined
}

/**
 * useRequest是一个定制化的请求钩子，用于处理异步请求和响应。
 * @param func 一个执行异步请求的函数，返回一个包含响应数据的Promise。
 * @param options 包含请求选项的对象 {immediate, initialData}。
 * @param options.immediate 是否立即执行请求，默认为false。
 * @param options.initialData 初始化数据，默认为undefined。
 * @returns 返回一个对象{loading, error, data, run}，包含请求的加载状态、错误信息、响应数据和手动触发请求的函数。
 */
export default function useRequest<T, P = undefined>(
  func: (args?: P) => Promise<T>,
  options: UseRequestOptions<T, P> = { immediate: false },
): UseRequestReturn<T, P> {
  const loading = ref(false)
  const error = ref<false | Error>(false)
  const data = ref<T | undefined>(options.initialData) as Ref<T | undefined>
  let requestId = 0
  let lastArgs = options.defaultParams

  const run = async (args?: P) => {
    const currentRequestId = requestId + 1
    const currentArgs = args === undefined ? options.defaultParams : args
    const cacheOptions = options.cache || undefined
    const cacheKey = resolveRequestCacheKey(cacheOptions, currentArgs)

    requestId = currentRequestId
    lastArgs = currentArgs

    if (cacheKey) {
      const cached = readRequestCache<T>(cacheKey)

      if (cached.hit) {
        data.value = cached.data
        error.value = false
        loading.value = false
        options.onSuccess?.(cached.data, currentArgs)
        return cached.data
      }
    }

    loading.value = true

    try {
      const res = await runRequest(func, currentArgs, cacheKey, cacheOptions)

      if (currentRequestId === requestId) {
        data.value = res
        error.value = false
        writeRequestCache(cacheKey, res, cacheOptions)
        options.onSuccess?.(res, currentArgs)
      }

      return res
    }
    catch (err) {
      const normalizedError = toError(err)

      if (currentRequestId === requestId) {
        error.value = normalizedError
        options.onError?.(normalizedError, currentArgs)
      }

      throw err
    }
    finally {
      if (currentRequestId === requestId) {
        loading.value = false
      }
    }
  }

  const refresh = () => run(lastArgs)

  const reset = () => {
    requestId += 1
    lastArgs = options.defaultParams
    loading.value = false
    error.value = false
    data.value = options.initialData
  }

  const mutate = (input: MutateInput<T>) => {
    data.value = typeof input === 'function'
      ? (input as (current: T | undefined) => T | undefined)(data.value)
      : input

    return data.value
  }

  if (options.immediate) {
    void run(options.defaultParams).catch(() => undefined)
  }

  return { loading, error, data, run, refresh, reset, mutate }
}

export function invalidateRequestCache(key?: RequestCacheKey) {
  if (key === undefined) {
    requestCache.clear()
    pendingRequests.clear()
    return
  }

  const cacheKey = normalizeRequestCacheKey(key)

  if (!cacheKey) {
    return
  }

  requestCache.delete(cacheKey)
  pendingRequests.delete(cacheKey)
}

async function runRequest<T, P>(
  func: (args?: P) => Promise<T>,
  args: P | undefined,
  cacheKey: string | undefined,
  cacheOptions: RequestCacheOptions<P> | undefined,
) {
  if (!cacheKey || cacheOptions?.dedupe === false) {
    return func(args)
  }

  const pending = pendingRequests.get(cacheKey) as Promise<T> | undefined
  if (pending) {
    return pending
  }

  const request = func(args).finally(() => {
    pendingRequests.delete(cacheKey)
  })

  pendingRequests.set(cacheKey, request)
  return request
}

function resolveRequestCacheKey<P>(
  cacheOptions: RequestCacheOptions<P> | undefined,
  args: P | undefined,
) {
  if (!cacheOptions) {
    return undefined
  }

  const key = typeof cacheOptions.key === 'function'
    ? cacheOptions.key(args)
    : cacheOptions.key

  return normalizeRequestCacheKey(key)
}

function normalizeRequestCacheKey(key: RequestCacheKey | false | null | undefined) {
  if (key === false || key === null || key === undefined) {
    return undefined
  }

  if (typeof key === 'string') {
    return key
  }

  return stableStringify(key)
}

function readRequestCache<T>(cacheKey: string): CacheReadResult<T> {
  const cached = requestCache.get(cacheKey)

  if (!cached) {
    return { hit: false }
  }

  if (cached.expiresAt <= Date.now()) {
    requestCache.delete(cacheKey)
    return { hit: false }
  }

  return { hit: true, data: cached.data as T }
}

function writeRequestCache<T, P>(
  cacheKey: string | undefined,
  data: T,
  cacheOptions: RequestCacheOptions<P> | undefined,
) {
  if (!cacheKey || !cacheOptions) {
    return
  }

  const cacheTime = cacheOptions.cacheTime ?? DEFAULT_REQUEST_CACHE_TIME
  if (cacheTime <= 0) {
    return
  }

  requestCache.set(cacheKey, {
    data,
    expiresAt: Date.now() + cacheTime,
  })
}

function stableStringify(value: unknown) {
  const seen = new WeakSet<object>()

  return JSON.stringify(value, (_key, item) => {
    if (!item || typeof item !== 'object') {
      return item
    }

    if (seen.has(item)) {
      return '[Circular]'
    }

    seen.add(item)

    if (Array.isArray(item)) {
      return item
    }

    return Object.keys(item)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = (item as Record<string, unknown>)[key]
        return result
      }, {})
  })
}

function toError(error: unknown) {
  if (error instanceof Error) {
    return error
  }

  return new Error(String(error))
}
