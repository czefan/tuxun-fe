# 本地 Mock 与测试夹具 (`src/mocks`)

本目录管理本地开发与单元测试使用的 Mock API Handlers、伪数据与媒体资源。

---

## ⚙️ 核心组成

1. **Mock 资源资产 (`src/mocks/assets/`)**：
   - 包含示例测试大图与占位图。
   - 在 `index.ts` 中导出并包含原始宽高属性（`width` / `height`），保证本地 Mock 渲染瀑布流时不发生变形或闪烁。

2. **契约校验守卫 (`contract-guard.test.ts`)**：
   - 使用 Ajv Schema 校验器自动校验本地 Mock 数据是否 100% 满足 `contract/apifox-import.json` 定义的格式，防止前端伪数据与后端真实契约脱节。

3. **否定探针测试 (`negative-guards.test.ts`)**：
   - 验证边界异常、401/403 权限拒绝逻辑。
