# 全局状态管理 (`src/store`)

本目录使用 Pinia 管理应用客户端基础状态与会话凭据。

---

## 📌 状态划分说明

- **`auth.ts`**：
  - 存放 `sessionId` / `userId`、`hasSession` 标志位与登录态判断 `isLoggedIn`。
  - `token` 字段仅在后端确实下发时才写入；本项目为 cookie 会话，前端拿不到 token，恒为空，登录态**不能**只判 `!!token`。
  - 集成了 `pinia-plugin-persistedstate` 插件，在 H5 与小程序中自动持久化至本地存储。
- **`question-like.ts`**：题目点赞的客户端本地状态。
- **与 Vue Query 的职责划分**：
  - 本目录仅存放客户端本地持久化状态。
  - 服务端数据（如活动列表、题目详情、用户资料等）统一由 `@tanstack/vue-query` 管理，禁止存入 Pinia。
