# 接口契约（单一事实源）

本目录包含 `tuxun-fe` 项目接口契约的核心定义，属于**代码生成与自动化测试的权威输入源**。

---

## 📁 文件说明

| 文件                 | 类型        | 用途与消费规则                                                                                                                   |
| -------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `apifox-import.json` | OpenAPI 3.0 | **机器消费**：`pnpm gen:api-types` 读取生成 `src/service/contract/schema.d.ts`；`pnpm check:contract` 与 Mock 测试断言读取此文件 |
| `api.md`             | Markdown    | **人工消费**：接口说明、鉴权逻辑、业务细节与枚举声明                                                                             |

---

## ⚠️ 同步更新规则

`apifox-import.json` 与 `api.md` 必须保持**双向同步**。修改后端契约后，需按以下步骤操作：

1. 替换本目录下的 `apifox-import.json` 与 `api.md`。
2. 重新生成 TypeScript 强类型定义：

   ```bash
   pnpm gen:api-types
   ```

3. 校验契约一致性：

   ```bash
   pnpm check:contract
   ```

4. 运行单元测试验证 Mock 契约对齐：

   ```bash
   pnpm test:run
   ```
