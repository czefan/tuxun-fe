import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface QuestionTransitionRect {
  top: number
  left: number
  width: number
  height: number
}

export interface QuestionTransitionQuestion {
  id: number
  title: string
  cover: string
  coverWidth: number
  coverHeight: number
  avatar: string
  author: string
  heat: string
  location: string
  overlayText?: string
  isVideo?: boolean
  body: string
  answerEnded?: boolean
  liked?: boolean
}

export interface QuestionTransitionSnapshot {
  questionId: number
  rect: QuestionTransitionRect
  scrollTop: number
}

export interface QuestionTransitionViewportSnapshot {
  html: string
  height: number
}

export type QuestionTransitionMode = 'enter' | 'leave'

export const questionTransitionDuration = 300

export interface QuestionTransitionFlight {
  mode: QuestionTransitionMode
  question: QuestionTransitionQuestion
  cardRect: QuestionTransitionRect | null
  scrollTop: number
  viewportSnapshot: QuestionTransitionViewportSnapshot | null
  playing: boolean
}

export const useQuestionTransitionStore = defineStore('questionTransition', () => {
  const snapshot = ref<QuestionTransitionSnapshot | null>(null)
  const pendingReturnQuestionId = ref<number | null>(null)
  const flight = ref<QuestionTransitionFlight | null>(null)

  function setSnapshot(nextSnapshot: QuestionTransitionSnapshot) {
    snapshot.value = nextSnapshot
  }

  function markPendingReturn(questionId: number) {
    pendingReturnQuestionId.value = questionId
  }

  function clearPendingReturn() {
    pendingReturnQuestionId.value = null
  }

  function clearSnapshot() {
    snapshot.value = null
  }

  function startFlight(
    mode: QuestionTransitionMode,
    question: QuestionTransitionQuestion,
    cardRect: QuestionTransitionRect | null = null,
    scrollTop = 0,
    viewportSnapshot: QuestionTransitionViewportSnapshot | null = null,
  ) {
    flight.value = {
      mode,
      question,
      cardRect,
      scrollTop,
      viewportSnapshot,
      playing: false,
    }
  }

  function setCardRect(cardRect: QuestionTransitionRect) {
    if (!flight.value) {
      return
    }

    flight.value = {
      ...flight.value,
      cardRect,
    }
  }

  function playFlight() {
    if (!flight.value) {
      return
    }

    flight.value = {
      ...flight.value,
      playing: true,
    }
  }

  function clearFlight() {
    flight.value = null
  }

  return {
    snapshot,
    pendingReturnQuestionId,
    flight,
    setSnapshot,
    markPendingReturn,
    clearPendingReturn,
    clearSnapshot,
    startFlight,
    setCardRect,
    playFlight,
    clearFlight,
  }
})
