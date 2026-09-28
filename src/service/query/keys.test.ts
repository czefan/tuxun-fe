import { QueryClient } from '@tanstack/vue-query'
import { describe, expect, it } from 'vitest'
import { qk } from './keys'

describe('查询缓存失效范围', () => {
  it.each([
    qk.record.photos,
    qk.record.attempts,
    qk.score.logs,
    qk.mall.goods,
    qk.mall.exchanges,
    qk.notification.announcements,
    qk.notification.interactions,
  ])('无参数 key 能失效该域的全部筛选缓存', async (key) => {
    const client = new QueryClient()
    const filteredKey = key({ keyword: 'test', status: 'pending' })
    client.setQueryData(filteredKey, { list: [1] })
    client.setQueryData(['unrelated'], 'keep')
    await client.invalidateQueries({ queryKey: key() })
    expect(client.getQueryState(filteredKey)?.isInvalidated).toBe(true)
    expect(client.getQueryState(['unrelated'])?.isInvalidated).toBe(false)
    client.clear()
  })
})
