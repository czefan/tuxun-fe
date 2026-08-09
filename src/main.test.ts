/**
 * 应用装配冒烟测试。
 *
 * 背景：18 个页面全部依赖 `useQuery` / `useInfiniteQuery`，而 `VueQueryPlugin`
 * 一旦忘记安装，只会在页面挂载时抛 `No queryClient found in Vue context`——
 * 这是运行时错误，type-check 与 build 都发现不了，曾经真的漏到过主干。
 */
import { describe, expect, it } from 'vitest'
import { createApp } from '@/main'

describe('应用装配', () => {
  it('安装了 VueQueryPlugin，页面能拿到 QueryClient', () => {
    const { app } = createApp()
    const provides = (app._context as { provides: Record<string | symbol, unknown> }).provides
    const injected = Reflect.ownKeys(provides)
      .map(key => provides[key])
      .filter(value => value && typeof value === 'object')

    const hasQueryClient = injected.some(
      value => typeof (value as { getQueryCache?: unknown }).getQueryCache === 'function',
    )

    expect(hasQueryClient, '未安装 VueQueryPlugin：所有使用 useQuery 的页面都会在挂载时崩溃').toBe(true)
  })

  it('安装了 Pinia，store 可用', () => {
    const { app } = createApp()
    const provides = (app._context as { provides: Record<string | symbol, unknown> }).provides
    const hasPinia = Reflect.ownKeys(provides).some(
      key => (provides[key] && typeof (provides[key] as { install?: unknown }).install === 'function')
        || String(key).includes('pinia'),
    )

    expect(hasPinia).toBe(true)
  })
})
