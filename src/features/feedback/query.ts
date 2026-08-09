import { useMutation } from '@tanstack/vue-query'
import { submitFeedback } from './api'
import type { SubmitFeedbackPayload } from './types'

export function useSubmitFeedback() {
  return useMutation({
    mutationFn: (payload: SubmitFeedbackPayload) => submitFeedback(payload),
  })
}
