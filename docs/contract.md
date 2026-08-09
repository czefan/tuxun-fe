# 接口契约规约文档

本文档定义 `tuxun-fe` 项目的网络接口契约、单一事实源规范与错误码映射机制。

---

## 🔑 契约单一事实源 (Single Source of Truth)

1. **权威契约源**：位于根目录 `contract/` 下：
   - `apifox-import.json`（OpenAPI 3.0 机器可读标准，用于代码生成与自动化校验）
   - `api.md`（人工阅读与业务语义说明）
2. **TypeScript 强类型**：`src/service/contract/schema.d.ts` 由 `openapi-typescript` 命令（`pnpm gen:api-types`）根据 `apifox-import.json` 自动生成，**禁止直接手改**。
3. **契约对齐校验**：`scripts/check-contract.py`（命令 `pnpm check:contract`）自动核对两份契约定义是否一致。

---

## 📌 关键业务与字段约束

- **分页约束**：
  - `DEFAULT_PAGE_SIZE = 10`，`MAX_PAGE_SIZE = 20`。
  - 所有列表接口的 `page_size` 需限制在 `1 ~ 20` 范围。
  - 响应字段 `total` 为过滤后的实际记录总数。
- **核销码规范 (`verify_code`)**：
  - 由后端生成的 8~16 位大写英数字组合，生成后不可更改，全局唯一。
- **媒体规范 (`Media` / `FeedbackMedia`)**：
  - 图片/媒体宽高等字段非空时最小值为 1 (`minimum: 1`)。
- **关联类型 (`related_type`)**：
  - 系统通知：`'activity'`
  - 互动消息：`'photo' | 'solve' | 'comment'`
- **作答提交**：
  - `POST /photos/{id}/attempts` 的成功创建响应统一为 `{ id: number, status: 'pending' }`。

---

## 📊 状态码与业务错误码映射

### HTTP 状态码与 code 映射表

| HTTP 状态码   | 业务 `code` | 说明                             |
| ------------- | ----------- | -------------------------------- |
| `200` / `201` | `0`         | 操作成功                         |
| `400`         | `3`         | 请求参数错误或业务前置条件不满足 |
| `401`         | `4` / `6`   | 未登录或登录凭证过期             |
| `403`         | `5` / `7`   | 权限不足或操作受限               |
| `404`         | `6`         | 指定路径资源不存在               |
| `409`         | `8`         | 业务冲突 / 重复提交 / 并发冲突   |
| `429`         | `9`         | 访问频率超限                     |
| `500`         | `4`         | 服务器内部未知错误               |
