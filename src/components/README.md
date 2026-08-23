# 通用公共组件 (`src/components`)

本目录存放全站通用的 UI 基础组件。

---

## ⚙️ 规范与引入方式

1. **组件引入与依赖**：
   - 配置了 `vite-plugin-uni-components` 插件（用于第三方 UI 库如 Wot Design Uni 组件的自动解析）。
   - **项目内公共组件统一采用显式按需 `import`**（例：`import LikeButton from '@/components/like-button/like-button.vue'`），以保证依赖关系清晰可追溯、IDE 重构友好以及 Knip 死代码检测的准确性。
   - 全局组件类型声明由插件生成在 `src/types/components.d.ts`。

2. **组件设计原则**：
   - **零业务耦合**：不得直接依赖特定业务 Feature（如 `features/user` 或 `features/activity`）。
   - **小程序胶囊适配**：导航栏相关组件必须正确兼容微信小程序顶部状态栏与胶囊控件高度。
