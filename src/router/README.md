# Router

`src/router` 不是 VueRouter。uni-app 页面导航由 `pages/`、`subPages/`、生成的 `src/pages.json` 和 `uni.navigateTo` / `uni.switchTab` 驱动。

这个目录只负责导航守卫：

- `auth.ts`：登录策略、登录页路径、受守卫控制的路径列表。
- `guard.ts`：通过 `uni.addInterceptor` 注册 `navigateTo`、`redirectTo`、`reLaunch`、`switchTab` 守卫。

## 登录策略

`LOGIN_STRATEGY` 支持两种模式：

- `DEFAULT_NO_NEED_LOGIN`：页面默认公开访问，`EXCLUDE_LOGIN_PATH_LIST` 中的路径需要登录。
- `DEFAULT_NEED_LOGIN`：页面默认需要登录，`EXCLUDE_LOGIN_PATH_LIST` 中的路径公开访问。

页面也可以在 `definePage` 中设置 `excludeLoginPath`，它会被合并进 `EXCLUDE_LOGIN_PATH_LIST`。

当前登录页是 `AppRoute.AuthLogin`，实际路径为 `/subPages/auth/login`。

## 平台差异

小程序构建中，`LOGIN_PAGE_ENABLE_IN_MP = false` 表示跳过 H5 登录页守卫，由平台登录流程处理授权。

TabBar 当前项同步在 `guard.ts` 中处理；TabBar 配置和渲染仍然归 `src/tabbar` 管理。
