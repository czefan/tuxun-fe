# 全局状态管理 (`src/store`)

本目录使用 Pinia 管理应用客户端基础状态与会话凭据。

---

## 📌 状态划分说明

- **`auth.ts`**：
  - 存放 `sessionId` / `userId`、`hasSession` 标志位与登录态判断 `isLoggedIn`。
  - `token` 字段仅在后端确实下发时才写入；本项目为 cookie 会话，前端拿不到 token，恒为空，登录态**不能**只判 `!!token`。
  - 集成了 `pinia-plugin-persistedstate` 插件，在 H5 与小程序中自动持久化至本地存储。
- **与 Vue Query 的职责划分**：
  - 本目录存放客户端会话状态；`sessionVersion` 仅在运行期递增，不持久化。
  - 列表、详情、点赞状态与乐观更新统一由 `@tanstack/vue-query` 管理，不另建一份点赞 store。
  - `features/user/store/user.ts` 保留用于恢复会话的持久化资料快照；界面实时资料通过用户查询获取。失去会话时同时清理资料、草稿与查询缓存，并恢复当前可访问的列表。
