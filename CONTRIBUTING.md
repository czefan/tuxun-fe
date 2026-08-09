# 开发者参与贡献指南

欢迎参与图寻前端（`tuxun-fe`）项目开发。提交代码或发起 Pull Request 前，请阅读并遵守以下规范。

---

## 🛠️ 本地开发与质量校验

提交代码前，请确保本地通过项目的静态与测试校验：

```bash
# 运行完整校验（静态资源、Lint、类型检查、单元测试）
pnpm check

# 本地并行极速校验
pnpm check:parallel

# 单独校验项
pnpm lint            # 运行 oxlint 与 eslint
pnpm lint:fix        # 自动修复代码格式问题
pnpm type-check      # vue-tsc 类型检查
pnpm test:run        # 运行单元测试
pnpm check:contract  # 校验 API 契约一致性
pnpm check:boundaries# 校验分层依赖隔离
pnpm fmt             # oxfmt 格式化文档与配置文件
```

---

## 📐 架构规范与目录指引

项目采用依赖倒置与分层架构，关于详细的分层约束、状态管理及数据流约定，请参阅：
👉 **[项目前端架构与分层规范 (docs/architecture.md)](docs/architecture.md)**

### 核心规则速览

1. **统一接口导入**：业务层必须从 `@/service/api` 导入 API 接口，禁止在页面层直接写裸 HTTP 请求。
2. **状态管理**：服务端状态使用 `@tanstack/vue-query`，客户端状态使用 Pinia。
3. **路由分包**：主包仅保留 TabBar 核心页面（`index`, `my`, `history`, `notice`），其余二级页面统一放入 `subPages/` 分包。
4. **静态资源**：主包禁止存放过大媒体文件，单静态资源必须 `<= 300KB`（通过 `pnpm check:assets` 校验）。

---

## 📝 Git Commit 提交规范

项目强制开启 Git Commit 消息校验，请使用标准 **Angular Commit 格式**：

```text
<type>(<scope>): <subject>
```

### Type 类型说明

- `feat`：新增功能
- `fix`：修复缺陷
- `docs`：文档更新
- `style`：代码格式调整（不改变逻辑）
- `refactor`：代码重构（不增加功能也不修复 bug）
- `perf`：性能优化
- `test`：增加或修改测试用例
- `chore`：构建过程、依赖库或辅助脚本变动

### 提交示例

```bash
git commit -m "feat(auth): 增加登录失效自动重定向机制"
git commit -m "fix(photo): 修复详情页图片拉伸显示异常"
```
