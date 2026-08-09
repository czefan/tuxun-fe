import { activityHandlers } from './activity'
import { attemptHandlers } from './attempt'
import { commentHandlers } from './comment'
import { contentHandlers } from './content'
import { mallHandlers } from './mall'
import { notificationHandlers } from './notification'
import { photoHandlers } from './photo'
import { scoreHandlers } from './score'
import { userHandlers } from './user'

export const handlers = [
  ...userHandlers,
  ...activityHandlers,
  // CRITICAL: photoHandlers 中 /photos/user 必须置于 /photos/:id 前
  ...photoHandlers,
  ...attemptHandlers,
  ...commentHandlers,
  ...scoreHandlers,
  ...mallHandlers,
  ...notificationHandlers,
  ...contentHandlers,
]
