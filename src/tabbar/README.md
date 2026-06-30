# TabBar

`src/tabbar` 负责底部导航的配置、状态和自定义渲染。

- `config.ts`：TabBar 策略、原生 TabBar 配置、自定义 TabBar 配置。
- `store.ts`：当前 TabBar 选中项、badge 和路径匹配。
- `MainTabBar.vue`：自定义 TabBar 主组件。
- `index.vue`：`@uni-ku/root` 挂载入口，处理自定义 TabBar 隐藏原生 TabBar 等平台差异。
- `i18n.ts`：原生 TabBar 多语言文本同步。

当前项目使用 `CUSTOM_TABBAR` 策略。TabBar 页面路径应同时维护在：

- `src/tabbar/config.ts`：用于渲染和生成 `pages.json` 的 TabBar 配置。
- `src/router/routes.ts`：用于业务判断 TabBar 路由和安全跳转。

导航守卫中的当前项同步由 `src/router/guard.ts` 调用 `tabbarStore` 完成。
