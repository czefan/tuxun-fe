# 网络服务层 (`src/service`)

本目录管理 `tuxun-fe` 项目的网络 API 客户端、接口契约类型与底层 HTTP 请求库。

---

## 📂 子目录职责

- **`api/`**：按业务模块导出的 API 接口客户端函数。
- **`contract/`**：`schema.d.ts` OpenAPI 自动生成的强类型声明。
- **`request/`**：底层 `uni.request` 适配器与统一请求/响应拦截器。
- **`query/`**：全局 TanStack Vue Query 的 Query Key 工厂管理（`keys.ts`）。
