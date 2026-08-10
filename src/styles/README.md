# 全局样式规范 (`src/styles`)

本目录定义项目的全局公共样式、CSS 变量与设计 Token。

---

## 📂 目录结构

- **`constants.ts`**：设计 Token 常量（品牌色等）。
- **`index.scss`**：全局基础样式。
- **`uno/`**：UnoCSS 配置 —— `theme.ts`（主题）、`shortcuts.ts`（简写）、`rules.ts`（自定义规则，如 `font-numeric`）、`transitions.ts`。

---

## 🎨 样式架构与规则

1. **UnoCSS 优先**：
   - 页面布局、边距、字号与颜色等优先使用 UnoCSS 工具类。
2. **`uni.scss` 注入规则**：
   - `src/uni.scss` 为自动注入各组件的全局 Sass 配置文件，**仅允许定义 Variables（变量）和 Mixins（混合器）**。
   - 严禁在 `src/uni.scss` 中直接编写具体的 CSS 选择器，避免重复打包导致 CSS 体积膨胀。
3. **全局样式引入**：
   - 具体的 CSS 选择器样式与基础重置样式写在本目录或 `src/App.vue` 中。
