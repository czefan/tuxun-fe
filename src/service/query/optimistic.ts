import type { QueryClient } from '@tanstack/vue-query'
import { useAuthStore } from '@/store/auth'

/** 取消旧查询后创建快照；异步等待期间换会话时不再发起旧操作。 */
export async function beginOptimisticUpdate(
  client: QueryClient,
  filters: NonNullable<Parameters<QueryClient['cancelQueries']>[0]>,
) {
  const auth = useAuthStore()
  const version = auth.sessionVersion
  const isCurrent = () => auth.sessionVersion === version
  await client.cancelQueries(filters)
  if (!isCurrent()) throw new Error('会话已变化，请重新操作')
  const previous = client.getQueriesData(filters)

  // 在同步乐观更新之后调用，记录本次实际写入的数据引用。
  return () => {
    const applied = new Map(client.getQueriesData(filters))
    return {
      isCurrent,
      rollback() {
        if (!isCurrent()) return
        for (const [key, data] of previous) {
          const current = client.getQueryData(key)
          if (current === undefined) continue
          if (current === applied.get(key)) {
            if (data !== undefined) client.setQueryData(key, data)
          }
          // 包括多次操作都失败的情况：旧快照可能含另一次乐观值，需与服务端收敛。
          if (current !== data) void client.invalidateQueries({ queryKey: key, exact: true })
        }
      },
    }
  }
}
