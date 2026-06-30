import { getAllPages } from './page'
import { AppRoute } from './routes'

export const LOGIN_STRATEGY_MAP = {
  DEFAULT_NO_NEED_LOGIN: 0, // 黑名单策略，默认可以进入APP
  DEFAULT_NEED_LOGIN: 1, // 白名单策略，默认不可以进入APP，需要强制登录
}

// 当前使用默认无需登录策略：页面默认可访问，名单内路径需要登录。
export const LOGIN_STRATEGY = LOGIN_STRATEGY_MAP.DEFAULT_NO_NEED_LOGIN
export const isNeedLoginMode = LOGIN_STRATEGY === LOGIN_STRATEGY_MAP.DEFAULT_NEED_LOGIN

export const LOGIN_PAGE = AppRoute.AuthLogin

// 在 definePage 里面配置了 excludeLoginPath 的页面，功能与 EXCLUDE_LOGIN_PATH_LIST 相同
export const excludeLoginPathList = getAllPages('excludeLoginPath').map(page => page.path)

// 排除在外的列表，白名单策略指白名单列表，黑名单策略指黑名单列表
export const EXCLUDE_LOGIN_PATH_LIST = [
  ...excludeLoginPathList, // 都是以 / 开头的 path
]

// 在小程序里面是否使用H5的登录页，默认为 false
// 如果为 true 则复用 h5 的登录逻辑
export const LOGIN_PAGE_ENABLE_IN_MP = false
