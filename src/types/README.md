# 类型定义划分规范 (`src/types`)

本目录及全站 TypeScript 类型存放遵循以下分工与规则：

---

## 📐 类型存放分工表

| 分类                  | 存放位置                           | 说明与规范                                                                              |
| --------------------- | ---------------------------------- | --------------------------------------------------------------------------------------- |
| **全局声明**          | `src/types/*.d.ts`                 | 存放全局环境声明、第三方模块补丁及自动生成类型（如 `uni-pages.d.ts`）。                 |
| **契约 DTO**          | `src/service/contract/schema.d.ts` | OpenAPI 工具根据 `contract/apifox-import.json` 自动生成的强类型契约，**禁止手动修改**。 |
| **通用/公共契约 VM**  | `src/service/contract/types.ts`    | 跨业务域通用的 Contract ViewModel 映射与基础类型（如 `ImageVM`, `PageResult` 等）。     |
| **业务域 DTO / VM**   | `src/features/*/types.ts`          | 各业务域专属的请求参数、响应 DTO 与 View Model 结构。                                   |
| **页面/组件私有类型** | 就近存放在各目录的 `types.ts`      | 页面或组件私有的临时状态定义（如 `subPages/question/types.ts`）。                       |

---

## ⚠️ 编写约束

1. **强类型第一**：优先使用 `schema.d.ts` 导出的契约类型，避免用 `any` 或重新手写重构 DTO。
2. **ViewModel 解耦**：当组件渲染需要将后端的 `snake_case` 转换为前端 `camelCase` 或扩展 UI 辅助属性时，在业务域 View Model 或就近 `types.ts` 中定义派生类型。
