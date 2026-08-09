import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

/**
 * 会话态（基础设施层）。
 *
 * 只保存「当前是否已登录」，不含任何用户资料——资料属于业务域，放在
 * features/user。这样 router/guard、request 拦截器等基础设施才能读登录态
 * 而不用反向依赖 features。
 *
 * 注意：本项目走的是 **cookie 会话**（`GET /user/logincallback` 之后由后端下发），
 * 前端拿不到也不需要 token。所以登录态**不能**只判 `!!token`——
 * 那样在生产环境恒为 false，路由守卫和点赞/评论的登录判断会全部失效。
 * `hasSession` 由 features/user 在拿到个人信息后回写。
 */
export const useAuthStore = defineStore(
  'auth',
  () => {
    /** 仅在后端确实下发 token 时才有值；cookie 会话下恒为空 */
    const token = ref('')
    /** cookie 会话标记：拿到个人信息即视为已登录 */
    const hasSession = ref(false)
    /** 跨端会话 ID（header X-Session-Id），如小程序环境 */
    const sessionId = ref('')
    /** 当前登录用户的 ID */
    const userId = ref<number | null>(null)
    /** 全局登录/调试确认弹窗显隐状态 */
    const showLoginModal = ref(false)

    const isLoggedIn = computed(() => !!token.value || hasSession.value || !!sessionId.value)

    function openLoginModal() {
      showLoginModal.value = true
    }

    function closeLoginModal() {
      showLoginModal.value = false
    }

    function setToken(newToken: string) {
      token.value = newToken
      if (newToken) {
        hasSession.value = true
      }
    }

    function setUserId(id: number | null) {
      userId.value = id
    }

    /** 设置跨端 Session ID */
    function setSessionId(newSessionId: string) {
      sessionId.value = newSessionId
      hasSession.value = Boolean(newSessionId)
    }

    /** 由 features/user 在写入/清空个人信息时调用 */
    function setSession(active: boolean) {
      hasSession.value = active
      if (!active) {
        sessionId.value = ''
        userId.value = null
      }
    }

    function clearToken() {
      token.value = ''
      sessionId.value = ''
      hasSession.value = false
      userId.value = null
      showLoginModal.value = false
    }

    return {
      token,
      hasSession,
      sessionId,
      userId,
      showLoginModal,
      isLoggedIn,
      openLoginModal,
      closeLoginModal,
      setToken,
      setUserId,
      setSessionId,
      setSession,
      clearToken,
    }
  },
  {
    persist: {
      omit: ['showLoginModal'],
    },
  },
)
