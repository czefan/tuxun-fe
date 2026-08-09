# 图寻前端项目（tuxun-fe）

基于 [unibest](https://unibest.tech/) 构建的图寻前端项目。

---

## 🛠️ 技术栈

- **模板**：[unibest](https://unibest.tech/)
- **框架**：[Uni-app](https://uniapp.dcloud.net.cn/) (Vue 3 / TypeScript / Vite 5)
- **UI 组件库**：[Wot Design Uni](https://wot-ui.cn/) (`wot-ui-v2`)
- **CSS 框架**：[UnoCSS](https://unocss.dev/)
- **状态管理**：[Pinia](https://pinia.vuejs.org/) + [@tanstack/vue-query](https://tanstack.com/query/latest)
- **网络与契约**：适配 `uni.request` 的拦截器 + OpenAPI 自动生成契约类型
- **包管理器**：[pnpm](https://pnpm.io/)

---

## ⚙️ 环境要求

- **Node.js**：`>= v22.13.0`
- **pnpm**：`>= v11.0.0` (强制要求，配有 `only-allow pnpm`)
- **uv (Python)**：用于运行契约与依赖边界自动化校验脚本 (`scripts/check-*.py`)

---

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm i
```

### 2. 本地开发

```bash
# H5 平台 (浏览器访问 http://localhost:9000/)
pnpm dev

# 微信小程序 (微信开发者工具导入 dist/dev/mp-weixin 目录)
pnpm dev:mp
```

### 3. 构建打包

```bash
# H5 生产构建
pnpm build:h5

# 微信小程序生产构建
pnpm build:mp
```

---

## 📚 项目文档导航

完整详细的技术文档请查阅 **[docs/ 文档中心](docs/README.md)**：

- 📐 **[前端架构与规范](docs/architecture.md)**：分层依赖约束、数据流与类型定义规范。
- 🔑 **[接口契约规约](docs/contract.md)**：单一事实源、分页常数与错误码映射。
- 🌐 **[构建与部署指南](docs/deployment.md)**：Nginx SPA 部署与小程序发布。
- 🤝 **[参与贡献指南](CONTRIBUTING.md)**：静态校验命令与 Git 提交规范。

---

## 📜 License

[MIT](LICENSE)
