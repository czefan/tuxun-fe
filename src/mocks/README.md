# 本地 Mock 与测试夹具 (`src/mocks`)

本目录管理本地开发与单元测试使用的 Mock API Handlers、伪数据与媒体资源。

---

## ⚙️ 核心组成

1. **Mock 数据 (`data/`)**：
   - `db.ts`：内存态 mock 数据库；`placeholder.ts`：占位图（导出原始宽高属性 `width` / `height`，保证本地 Mock 渲染瀑布流时不发生变形或闪烁）；`rich-text.ts`：富文本示例。
2. **MSW Handlers (`handlers/`)**：各业务域接口的 Mock 实现，由 `index.ts`（浏览器端）与 `node.ts`（测试端）接入。
3. **契约校验守卫 (`contract-guard.test.ts`)**：
   - 使用 Ajv Schema 校验器自动校验本地 Mock 数据是否 100% 满足 `contract/apifox-import.json` 定义的格式，防止前端伪数据与后端真实契约脱节。
4. **否定探针测试 (`negative-guards.test.ts`)**：
   - 验证边界异常、401/403 权限拒绝逻辑。
