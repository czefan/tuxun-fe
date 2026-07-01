import { computed, ref } from 'vue'
import type { ComponentInternalInstance } from 'vue'
import {
  questionTransitionDuration,
  useQuestionTransitionStore,
} from './store'
import type { QuestionTransitionQuestion, QuestionTransitionRect } from './store'
import { getPageScrollTop, runAfterPaint } from '@/utils'
import { AppRoute, withQuery } from '@/router/routes'
import { useTimer } from '@/composables/useTimer'

interface QuestionTransitionSource {
  id: number
  title: string
  cover: string
  coverWidth: number
  coverHeight: number
  avatar?: string
  author?: string
  heat?: string
  location?: string
  overlayText?: string
  isVideo?: boolean
  body?: string
  answerEnded?: boolean
  liked?: boolean
}

type RectLike = Partial<Pick<QuestionTransitionRect, 'top' | 'left' | 'width' | 'height'>>

export function useQuestionTransitionFlight(
  instance: ComponentInternalInstance | null,
  findQuestionInList: (id: number) => QuestionTransitionSource | null | undefined,
) {
  const transitionStore = useQuestionTransitionStore()
  const timer = useTimer()
  const openingQuestionId = ref<number | null>(null)
  const activeReturnQuestionId = ref<number | null>(null)

  const isTransitionLocked = computed(() => Boolean(openingQuestionId.value || transitionStore.flight))

  function openQuestion(item: QuestionTransitionSource) {
    if (openingQuestionId.value || transitionStore.flight) {
      return
    }

    openingQuestionId.value = item.id

    queryCardRect(item.id, (transitionRect) => {
      const questionData = normalizeQuestion(item)

      transitionStore.setSnapshot({
        questionId: item.id,
        rect: transitionRect,
        scrollTop: getPageScrollTop(),
      })
      transitionStore.startFlight('enter', questionData, transitionRect)

      lockPageScroll()
      runAfterPaint(() => {
        transitionStore.playFlight()
        timer.setTimeout(() => {
          uni.navigateTo({
            url: getQuestionDetailUrl(item),
            fail: () => {
              openingQuestionId.value = null
              transitionStore.clearFlight()
              unlockPageScroll()
            },
          })
        }, questionTransitionDuration)
      })
    })
  }

  function handleShow() {
    const pendingQuestionId = transitionStore.pendingReturnQuestionId

    if (!pendingQuestionId) {
      openingQuestionId.value = null
      activeReturnQuestionId.value = null
      unlockPageScroll()
      return
    }

    const question = findQuestionInList(pendingQuestionId)

    openingQuestionId.value = pendingQuestionId
    activeReturnQuestionId.value = pendingQuestionId
    restoreSnapshotScroll(pendingQuestionId)

    runAfterPaint(() => {
      queryCardRect(pendingQuestionId, (transitionRect) => {
        if (!transitionStore.flight && question) {
          transitionStore.startFlight('leave', normalizeQuestion(question), transitionRect)
        }
        else {
          transitionStore.setCardRect(transitionRect)
        }

        runAfterPaint(() => {
          transitionStore.playFlight()
          timer.setTimeout(() => {
            openingQuestionId.value = null
            activeReturnQuestionId.value = null
            transitionStore.clearPendingReturn()
            transitionStore.clearFlight()
            unlockPageScroll()
          }, questionTransitionDuration)
        })
      })
    })
  }

  function queryCardRect(
    questionId: number,
    callback: (transitionRect: QuestionTransitionRect) => void,
  ) {
    const selector = `#question-card-${questionId}`

    // #ifdef H5
    const element = document.querySelector<HTMLElement>(selector)

    if (element) {
      const rect = normalizeRect(element.getBoundingClientRect())

      callback(rect ?? getFallbackRect())
      return
    }
    // #endif

    const query = instance?.proxy
      ? uni.createSelectorQuery().in(instance.proxy)
      : uni.createSelectorQuery()

    query
      .select(selector)
      .boundingClientRect((result: UniNamespace.NodeInfo | UniNamespace.NodeInfo[]) => {
        const node = Array.isArray(result) ? result[0] : result
        const rect = node ? normalizeRect(node) : null

        callback(rect ?? getFallbackRect())
      })
      .exec()
  }

  function normalizeQuestion(item: QuestionTransitionSource): QuestionTransitionQuestion {
    return {
      id: item.id,
      title: item.title,
      cover: item.cover,
      coverWidth: item.coverWidth,
      coverHeight: item.coverHeight,
      avatar: item.avatar ?? '',
      author: item.author ?? '',
      heat: item.heat ?? '',
      location: item.location ?? '',
      overlayText: item.overlayText,
      isVideo: item.isVideo,
      body: item.body ?? '',
      answerEnded: item.answerEnded,
      liked: item.liked,
    }
  }

  function getQuestionDetailUrl(item: QuestionTransitionSource) {
    return withQuery(AppRoute.QuestionDetail, {
      id: item.id,
      answerEnded: item.answerEnded ? 1 : undefined,
    })
  }

  function normalizeRect(rect: RectLike): QuestionTransitionRect | null {
    const nextRect = {
      top: rect.top ?? 0,
      left: rect.left ?? 0,
      width: rect.width ?? 0,
      height: rect.height ?? 0,
    }

    return isUsableRect(nextRect) ? nextRect : null
  }

  function getSnapshotRect(questionId: number): QuestionTransitionRect | null {
    const snapshot = transitionStore.snapshot

    if (!snapshot || snapshot.questionId !== questionId || !isUsableRect(snapshot.rect)) {
      return null
    }

    return snapshot.rect
  }

  function isUsableRect(rect: QuestionTransitionRect) {
    return (
      Number.isFinite(rect.top)
      && Number.isFinite(rect.left)
      && Number.isFinite(rect.width)
      && Number.isFinite(rect.height)
      && rect.width > 1
      && rect.height > 1
    )
  }

  function restoreSnapshotScroll(questionId: number) {
    const snapshot = transitionStore.snapshot

    if (!snapshot || snapshot.questionId !== questionId) {
      return
    }

    const scrollTop = snapshot.scrollTop

    if (!Number.isFinite(scrollTop)) {
      return
    }

    // #ifdef H5
    window.scrollTo(0, scrollTop)
    // #endif

    uni.pageScrollTo({
      scrollTop,
      duration: 0,
    })
  }

  function getFallbackRect(): QuestionTransitionRect {
    const windowInfo = uni.getWindowInfo()
    const width = windowInfo.windowWidth || 375
    const height = windowInfo.windowHeight || 667
    const snapshotRect = activeReturnQuestionId.value
      ? getSnapshotRect(activeReturnQuestionId.value)
      : null

    if (snapshotRect) {
      return snapshotRect
    }

    return {
      top: height * 0.24,
      left: width * 0.25,
      width: width * 0.5,
      height: height * 0.42,
    }
  }

  function lockPageScroll() {
    // #ifdef H5
    document.body.style.overflow = 'hidden'
    // #endif
  }

  function unlockPageScroll() {
    // #ifdef H5
    document.body.style.overflow = ''
    // #endif
  }

  return {
    openingQuestionId,
    isTransitionLocked,
    openQuestion,
    handleShow,
  }
}
