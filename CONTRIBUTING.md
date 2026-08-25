# 开发者参与贡献指南

欢迎参与图寻前端（`tuxun-fe`）项目开发。提交代码或发起 Pull Request 前，请阅读并遵守以下规范。

---

## 🛠️ 本地开发与质量校验

提交代码前，请确保本地通过项目的静态与测试校验：

```bash
# 运行完整校验
pnpm check

# 单独校验
pnpm lint:quick       # oxlint 极速自检
pnpm lint             # oxlint 与 eslint
pnpm fmt              # oxfmt 格式化
pnpm type-check       # vue-tsc 类型检查
pnpm test:run         # 运行单元测试
pnpm check:contract   # API 契约校验
pnpm check:boundaries # 分层依赖校验
pnpm changelog        # 生成更新日志
```

---

## 📐 架构规范与目录指引

项目采用依赖倒置与分层架构，关于详细的分层约束、状态管理及数据流约定，请参阅：
👉 **[项目前端架构与分层规范 (docs/architecture.md)](docs/architecture.md)**

### 核心规则速览

1. **业务域接口聚合**：业务 API 请求与 Query Hooks 统一收敛在各业务域 `@/features/*`，禁止在页面层直接调用裸 HTTP 请求。
2. **状态管理**：服务端状态使用 `@tanstack/vue-query`，客户端状态使用 Pinia。
3. **路由分包**：主包仅保留 TabBar 核心入口页面（`index`, `activity`, `notice`, `my`），其余二级页面统一放入 `subPages/` 分包。
4. **静态资源**：主包禁止存放过大媒体文件，单静态资源必须 `<= 300KB`（通过 `pnpm check:assets` 校验）。

---

## 📝 Git Commit 提交规范

项目强制开启 Git Commit 消息校验，请使用标准 **Conventional Commits 规范**：

```text
<type>(<scope>): <subject>
```

### Type 类型说明

- `feat`：新增功能
- `fix`：修复缺陷
- `docs`：文档更新
- `style`：代码格式调整
- `refactor`：代码重构
- `perf`：性能优化
- `test`：测试用例
- `build`：构建系统或依赖变动
- `ci`：CI 配置变动
- `chore`：辅助工具或脚本变动
- `revert`：代码回滚

### 提交示例

```bash
git commit -m "feat(auth): 增加登录失效自动重定向机制"
git commit -m "fix(photo): 修复详情页图片拉伸显示异常"
```
