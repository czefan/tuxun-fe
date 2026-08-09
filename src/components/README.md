# 通用公共组件 (`src/components`)

本目录存放全站通用的 UI 基础组件。

---

## ⚙️ 规范与自动解析

1. **自动按需引入**：
   - 配置了 `vite-plugin-uni-components` 插件，在页面模板中使用本目录下的组件时**无需手动 `import`**，直接写标签即可。
   - 自动生成的组件类型见 `src/types/components.d.ts`。

2. **组件设计原则**：
   - **零业务耦合**：不得直接依赖特定业务 Feature（如 `features/user` 或 `features/activity`）。
   - **小程序胶囊适配**：导航栏相关组件必须正确兼容微信小程序顶部状态栏与胶囊控件高度。
