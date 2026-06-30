import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useQuestionLikeStore = defineStore('questionLike', () => {
  const likedById = ref<Record<number, boolean>>({})

  function ensureQuestionLiked(questionId: number, fallbackLiked = false) {
    if (!Number.isFinite(questionId)) {
      return false
    }

    if (!Object.prototype.hasOwnProperty.call(likedById.value, questionId)) {
      likedById.value[questionId] = Boolean(fallbackLiked)
    }

    return likedById.value[questionId]
  }

  function getQuestionLiked(questionId: number, fallbackLiked = false) {
    if (!Number.isFinite(questionId)) {
      return false
    }

    return likedById.value[questionId] ?? Boolean(fallbackLiked)
  }

  function setQuestionLiked(questionId: number, liked: boolean) {
    if (!Number.isFinite(questionId)) {
      return false
    }

    likedById.value[questionId] = liked
    return likedById.value[questionId]
  }

  function toggleQuestionLiked(questionId: number, fallbackLiked = false) {
    const currentLiked = getQuestionLiked(questionId, fallbackLiked)

    return setQuestionLiked(questionId, !currentLiked)
  }

  return {
    likedById,
    ensureQuestionLiked,
    getQuestionLiked,
    setQuestionLiked,
    toggleQuestionLiked,
  }
})

export const useAnswerRecordLikeStore = defineStore('answerRecordLike', () => {
  const likedById = ref<Record<number, boolean>>({})

  function getAnswerRecordLiked(recordId: number, fallbackLiked = false) {
    if (!Number.isFinite(recordId)) {
      return false
    }

    return likedById.value[recordId] ?? Boolean(fallbackLiked)
  }

  function setAnswerRecordLiked(recordId: number, liked: boolean) {
    if (!Number.isFinite(recordId)) {
      return false
    }

    likedById.value[recordId] = liked
    return likedById.value[recordId]
  }

  function toggleAnswerRecordLiked(recordId: number, fallbackLiked = false) {
    const currentLiked = getAnswerRecordLiked(recordId, fallbackLiked)

    return setAnswerRecordLiked(recordId, !currentLiked)
  }

  return {
    likedById,
    getAnswerRecordLiked,
    setAnswerRecordLiked,
    toggleAnswerRecordLiked,
  }
})
