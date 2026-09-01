import type { MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'

/**
 * 合并「额外前置条件」与「调用方传入的 enabled」；未传 enabled 时视为 true。
 *
 * @param extra 内部硬性前置条件（如登录态 authStore.isLoggedIn 或 id > 0）
 * @param enabled 调用方可选传入的 enabled 控制开关
 */
export function resolveEnabled(
  extra: MaybeRefOrGetter<boolean>,
  enabled?: MaybeRefOrGetter<boolean>,
) {
  return computed(
    () => Boolean(toValue(extra)) && (enabled === undefined || Boolean(toValue(enabled))),
  )
}
