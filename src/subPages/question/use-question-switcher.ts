import { ref } from 'vue'
import type { Ref } from 'vue'
import { onUnload } from '@dcloudio/uni-app'
import { useQueryClient } from '@tanstack/vue-query'
import { AppRoute, withQuery } from '@/router/routes'
import { findAdjacentPhotoId } from '@/features/photo/query'
import type { PhotoFilterParams } from '@/features/photo/types'

const ACTIVITY_STATUS = ['active', 'ended'] as const
const SORT_BY = ['created_at', 'hot'] as const

function pick<T extends readonly string[]>(v: unknown, allow: T): T[number] | undefined {
  return typeof v === 'string' && (allow as readonly string[]).includes(v) ? v as T[number] : undefined
}

/**
 * 题目详情页上下滑动切题。
 *
 * 题目序列沿用进入详情页时的列表快照，保持切题顺序与用户此前的筛选/排序结果一致。
 */
export function useQuestionSwitcher(questionId: Ref<number>) {
  const queryClient = useQueryClient()
  const isSlideUping = ref(false)
  const isSlideDowning = ref(false)
  const showUndoBanner = ref(false)
  const touchStartY = ref(0)
  let bannerTimer: ReturnType<typeof setTimeout> | null = null

  const listContext = ref<PhotoFilterParams | null>(null)

  function initSwitcherFromQuery(query?: Record<string, any>) {
    if (query?.activity_id || query?.activity_status || query?.sort_by || query?.solved !== undefined || query?.keyword) {
      let keyword: string | undefined
      if (query.keyword) {
        try {
          keyword = decodeURIComponent(query.keyword)
        }
        catch {
          keyword = query.keyword
        }
      }
      listContext.value = {
        activity_id: query.activity_id ? Number(query.activity_id) : undefined,
        activity_status: pick(query.activity_status, ACTIVITY_STATUS),
        sort_by: pick(query.sort_by, SORT_BY),
        solved: query.solved !== undefined ? query.solved === 'true' : undefined,
        keyword,
      }
    }

    if (query?.fromCut === '1') {
      showUndoBanner.value = true
      if (bannerTimer) {
        clearTimeout(bannerTimer)
      }
      bannerTimer = setTimeout(() => {
        showUndoBanner.value = false
        bannerTimer = null
      }, 2000)
    }
  }

  onUnload(() => {
    if (bannerTimer) {
      clearTimeout(bannerTimer)
      bannerTimer = null
    }
  })

  /** 从缓存列表中推算前一个或后一个题目 ID */
  function getAdjacentPhotoId(offset: 1 | -1): number | null {
    return findAdjacentPhotoId(queryClient, listContext.value, questionId.value, offset)
  }

  /** 统一切题处理（offset: 1 为下一题，-1 为上一题） */
  function switchQuestion(offset: 1 | -1) {
    if (isSlideUping.value || isSlideDowning.value)
      return
    const targetId = getAdjacentPhotoId(offset)
    if (!targetId) {
      uni.showToast({ title: offset === 1 ? '已是最后一题了' : '已是第一题了', icon: 'none' })
      return
    }
    if (offset === -1)
      showUndoBanner.value = false
    const isUp = offset === 1
    isUp ? (isSlideUping.value = true) : (isSlideDowning.value = true)
    setTimeout(() => {
      uni.redirectTo({
        url: withQuery(AppRoute.QuestionDetail, {
          id: targetId,
          ...(isUp ? { fromCut: 1 } : {}),
          ...listContext.value,
        }),
        complete: () => {
          isSlideUping.value = false
          isSlideDowning.value = false
        },
      })
    }, 220)
  }

  function handleTouchStart(e: TouchEvent) {
    if (e.touches?.[0])
      touchStartY.value = e.touches[0].clientY
  }

  function handleTouchEnd(e: TouchEvent) {
    // 仅在专属长方形 Bar 内向上滑动超过 60px 触发
    if (e.changedTouches?.[0] && e.changedTouches[0].clientY - touchStartY.value < -60) {
      switchQuestion(1)
    }
  }

  return {
    handleTouchStart,
    handleTouchEnd,
    switchQuestion,
    isSlideUping,
    isSlideDowning,
    showUndoBanner,
    listContext,
    initSwitcherFromQuery,
  }
}
