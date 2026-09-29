import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDeleteComment } from '@/features/comment/query'
import { useSetSolveLike, useSubmitAttempt } from '@/features/attempt/query'
import type { SubmitAttemptPayload } from '@/features/attempt/types'
import { qk } from '@/service/query/keys'

vi.mock('@/features/comment/api', () => ({ deleteComment: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@/features/attempt/api', () => ({
  submitAttempt: vi.fn().mockResolvedValue({ status: 'solved' }),
  setSolveLike: vi.fn().mockResolvedValue({ liked: true }),
}))

let client: QueryClient
let wrapper: ReturnType<typeof mount>
beforeEach(() => {
  client = new QueryClient()
})
afterEach(() => {
  wrapper.unmount()
  client.clear()
})

function useMutation<T>(factory: () => T): T {
  let result!: T
  wrapper = mount(
    defineComponent({
      setup() {
        result = factory()
        return () => null
      },
    }),
    {
      global: { plugins: [[VueQueryPlugin, { queryClient: client }]] },
    },
  )
  return result
}

const page = (item: Record<string, unknown>) => ({
  pages: [{ list: [item], total: 1 }],
  pageParams: [1],
})

describe('乐观更新缓存隔离', () => {
  it('删除评论不能减少其他题目的评论总数', async () => {
    client.setQueryData(qk.comment.list(1), page({ id: 10 }))
    const other = page({ id: 20 })
    client.setQueryData(qk.comment.list(2), other)
    await useMutation(() => useDeleteComment(1)).mutateAsync(10)
    expect(client.getQueryData(qk.comment.list(1))).toMatchObject({
      pages: [{ list: [], total: 0 }],
    })
    expect(client.getQueryData(qk.comment.list(2))).toEqual(other)
  })

  it('提交题目不能按碰巧相同的记录 ID 改写个人作答记录', async () => {
    const records = page({ id: 7, userAttemptsCount: 2 })
    client.setQueryData(qk.record.attempts(), records)
    await useMutation(() => useSubmitAttempt()).mutateAsync({ photoId: 7 } as SubmitAttemptPayload)
    expect(client.getQueryData(qk.record.attempts())).toEqual(records)
    expect(client.getQueryState(qk.record.attempts())?.isInvalidated).toBe(true)
  })

  it('提交作答按请求携带的题目更新缓存', async () => {
    client.setQueryData(qk.photo.detail(7), { id: 7, userAttemptsCount: 0 })
    client.setQueryData(qk.photo.detail(8), { id: 8, userAttemptsCount: 0 })
    await useMutation(() => useSubmitAttempt()).mutateAsync({ photoId: 7 } as SubmitAttemptPayload)
    expect(client.getQueryData(qk.photo.detail(7))).toMatchObject({ userAttemptsCount: 1 })
    expect(client.getQueryData(qk.photo.detail(8))).toMatchObject({ userAttemptsCount: 0 })
  })

  it('公开答案点赞不能修改 ID 相同的个人作答缓存', async () => {
    client.setQueryData(qk.attempt.solves(1), page({ id: 7, liked: false, likesCount: 1 }))
    const attempts = page({ id: 7 })
    client.setQueryData(qk.attempt.userAttempts(1), attempts)
    await useMutation(() => useSetSolveLike()).mutateAsync({ solveId: 7, liked: true })
    expect(client.getQueryData(qk.attempt.solves(1))).toMatchObject({
      pages: [{ list: [{ liked: true, likesCount: 2 }] }],
    })
    expect(client.getQueryData(qk.attempt.userAttempts(1))).toEqual(attempts)
  })
})
