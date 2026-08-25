# 全局样式规范 (`src/styles`)

本目录定义项目的全局公共样式、CSS 变量与设计 Token。

---

## 📂 目录结构

- **`constants.ts`**：设计系统主题色常量（如 `TX_BG_MAIN`, `TX_BG_BROWN` 等）。
- **`index.css`**：全局基础样式与设计系统变量。
- **`uno/`**：UnoCSS 配置 —— `theme.ts`（主题色 Token 与字号）、`shortcuts.ts`（简写）、`rules.ts`（自定义规则，如 `font-numeric`）、`transitions.ts`。

---

## 🎨 样式架构与规则

1. **UnoCSS 优先**：
   - 页面布局、边距、字号与颜色等优先使用 UnoCSS 工具类。
2. **标准 CSS 架构**：
   - 业务层 100% 采用原生标准 CSS 编写（无需预编译器语法），设计变量通过 `src/styles/index.css` 中的 CSS 自定义属性全局注入。
3. **全局样式引入**：
   - 具体的 CSS 选择器样式与基础重置样式写在本目录或 `src/App.vue` 中。
