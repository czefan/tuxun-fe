# 组合式函数 (`src/composables`)

本目录存放全站通用的 Vue 3 组合式逻辑函数（Composables）。

---

## 📌 常见 Composables 说明

- **`use-auth.ts`**：基础设施层登录态判断（`isLoggedIn` / `isMe`）、登录触发与前置登录拦截。
- **`use-infinite-list-page.ts`**：列表页标准分页与下拉刷新管理（支持 Tab 分流）。
- **`use-map.ts`**：地图坐标转换（`pixelToCoordinate` 等）与选点定位。
- **`use-network-status.ts`**：网络状态监听。
- **`use-view-transition.ts`**：基于原生 View Transitions API 的页面转场。

---

## ⚠️ 编写约束

1. 必须遵循 Vue 组合式函数命名规范（以 `use` 开头）。
2. 保持逻辑高内聚，具有具体业务域特征的 Composables 建议放入对应的 `src/features/*` 域中。
