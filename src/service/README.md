# 网络服务层 (`src/service`)

本目录管理 `tuxun-fe` 项目的登录鉴权流程、接口契约类型、请求查询基础与底层 HTTP 请求库。

---

## 📂 子目录职责

- **`auth/`**：tz-oauth OAuth2 授权跳转、state CSRF 防护与登录回跳地址处理。
- **`contract/`**：契约单一事实源的 TypeScript 强类型（`schema.d.ts`，由 `pnpm gen:api-types` 生成）与 VM 映射工具（`types.ts`）。
- **`query/`**：TanStack Vue Query 的全局 client、Query Key 工厂（`keys.ts`）与分页钳制工具（`pagination.ts`）。
- **`request/`**：底层 `uni.request` / `uni.uploadFile` 适配与统一请求/响应拦截。

> 业务接口 API 函数收敛在各业务域 `src/features/*/api.ts`，不在本目录。
