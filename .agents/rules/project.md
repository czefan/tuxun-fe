---
trigger: model_decision
description: High-level agent development rules and guidelines for tuxun-fe.
---

# 图寻前端 (tuxun-fe) 开发规则

## 1. 框架速览

- 基于 UniApp + Vue 3 (Composition API) + TypeScript + Vite 5 + UnoCSS 构建。
- 开发优先以 **H5** 为主，兼顾微信小程序环境。
- 包管理器统一使用 **pnpm**（禁止使用 npm 或 yarn）。

## 2. 核心硬约束

1. **禁止直接修改生成产物**：切勿手动修改 `src/service/contract/schema.d.ts`、`src/pages.json`、`src/manifest.json` 及 `src/types/auto-import.d.ts` 等自动生成文件。
2. **依赖方向限制**：严格遵循单向依赖 `(pages / subPages / app) → features → (service / shared)`；`features` 之间禁止跨域相互 import；基础公共层（`components` / `composables` / `store` / `utils` / `constants` / `styles`）严禁反向依赖 `features` 与 `app`。
3. **命名空间与变体隔离**：契约中的 `snake_case` 只能存在于 `service/` 与各域 `api.ts` 内部，跨出 API 边界一律转换为 `camelCase` View Model。
4. **禁止导出 Barrel**：取消模块级 `index.ts` 统一导出机制（如无 `features/photo/index.ts`），必须精确按需导入。
5. **SFC 代码块顺序**：Vue SFC 统一必须按 `<script setup>` → `<template>` → `<style>` 顺序组织。
6. **文件名命名规范**：组件、composable 及普通 TS 模块文件名统一使用 `kebab-case`（例：`photo-card.vue`）。
7. **修改完成自检**：任何代码修改完成后，必须运行 `pnpm check` 确保类型与 Lint 全绿。
8. **小程序虚拟宿主节点 (`virtualHost`)**：根节点参与父级 Flex 或百分比高度链 (`h-full`) 的组件，必须配置 `defineOptions({ options: { virtualHost: true } })`。
9. **小程序插槽高度契约**：不得将带 `h-full` 契约的内容做成 `v-for` 中的具名作用域插槽（小程序端包裹容器会导致高度塌陷）。

## 3. 规则索引

- 详细架构分层与设计规约请参阅 [architecture.md](file:///home/chai_/Club/tuxun/tuxun-fe/docs/architecture.md)
- 契约对齐与接口规范请参阅 [contract.md](file:///home/chai_/Club/tuxun/tuxun-fe/docs/contract.md)
- 团队协作与提交规约请参阅 [CONTRIBUTING.md](file:///home/chai_/Club/tuxun/tuxun-fe/CONTRIBUTING.md)
