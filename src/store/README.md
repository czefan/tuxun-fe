# 全局状态管理 (`src/store`)

本目录使用 Pinia 管理应用客户端基础状态与会话凭据。

---

## 📌 状态划分说明

- **`auth.ts`**：
  - 存放 `session_id` / `token` 凭据、`hasSession` 标志位及 `userId`。
  - 集成了 `pinia-plugin-persistedstate` 插件，在 H5 与小程序中自动持久化至本地存储。
- **与 Vue Query 的职责划分**：
  - 本目录仅存放客户端本地持久化状态。
  - 服务端数据（如活动列表、题目详情、用户资料等）统一由 `@tanstack/vue-query` 管理，禁止存入 Pinia。
