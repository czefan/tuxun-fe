export const ApiEndpoint = {
  activity: {
    current: '/api/activity/current',
    history: '/api/activity/history',
    currentQuestions: '/api/activity/current/questions',
    questions: (activityId: number) => `/api/activity/${activityId}/questions`,
  },
  answer: {
    submit: '/api/answer/submit',
    mine: '/api/answers/mine',
    recordLike: (answerRecordId: number) => `/api/answer-records/${answerRecordId}/like`,
  },
  auth: {
    oauthLoginUrl: '/api/auth/oauth/login-url',
    oauthCode: '/api/auth/oauth/code',
    userInfo: '/api/auth/userinfo',
    logout: '/api/auth/logout',
  },
  comment: {
    create: '/api/comment',
    list: (questionId: number) => `/api/question/${questionId}/comments`,
  },
  mall: {
    products: '/api/mall/products',
    productDetail: (productId: number) => `/api/mall/products/${productId}`,
    exchange: '/api/mall/exchange',
    orders: '/api/mall/orders',
    verifyOrder: '/api/mall/orders/verify',
  },
  notice: {
    list: '/api/notices',
    detail: (noticeId: number) => `/api/notices/${noticeId}`,
    unreadCount: '/api/notices/unread-count',
    markRead: (noticeId: number) => `/api/notices/${noticeId}/read`,
    markAllRead: '/api/notices/read-all',
  },
  question: {
    detail: (id: number) => `/api/question/${id}`,
    contributions: '/api/question/contributions',
    myContributions: '/api/question/contributions/mine',
    answers: (questionId: number) => `/api/question/${questionId}/answers`,
    myAnswers: (questionId: number) => `/api/question/${questionId}/answers/mine`,
    like: (questionId: number) => `/api/question/${questionId}/like`,
  },
  upload: {
    avatar: '/api/upload/avatar',
    feedbackImage: '/api/upload/feedback-image',
    questionImage: '/api/upload/question-image',
  },
  user: {
    pointSummary: '/api/user/points/summary',
    pointLedger: '/api/user/points/ledger',
    pointRules: '/api/user/points/rules',
    feedback: '/api/user/feedback',
  },
} as const
