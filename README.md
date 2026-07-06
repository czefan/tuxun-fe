# 图寻前端项目（tuxun-fe）

基于 [unibest](https://unibest.tech/) 模板构建的图寻前端项目。

## 🛠️ 技术栈

- **模板**：[unibest](https://unibest.tech/)
- **框架**：[Uni-app](https://uniapp.dcloud.net.cn/) (Vue 3 组合式 API)
- **构建工具**：[Vite 5](https://vitejs.dev/)
- **语言**：[TypeScript](https://www.typescriptlang.org/)
- **状态管理**：[Pinia](https://pinia.vuejs.org/)
- **UI 组件库**：[Wot Design Uni](https://wot-ui.cn/) (`wot-ui-v2`)
- **CSS 框架**：[UnoCSS](https://unocss.dev/)
- **网络请求**：基于 `src/service/api` 与 `src/service/request` 的统一请求链路
- **包管理器**：[pnpm](https://pnpm.io/)

## ⚙️ 环境要求

- **Node.js**：`>= v22.13.0`
- **包管理器**：`pnpm >= v11.0.0` (项目配置了 `only-allow pnpm`，请勿使用 npm 或 yarn)

## 🚀 快速开始

1. **安装依赖**：

   ```bash
   pnpm i
   ```

2. **本地开发**：
   - **H5**：执行 `pnpm dev` (或 `pnpm dev:h5`)，浏览器访问 `http://localhost:9000/`。
   - **微信小程序**：执行 `pnpm dev:mp`，微信开发者工具导入 `dist/dev/mp-weixin` 目录。

## 📦 打包发布

- **H5**：执行 `pnpm build:h5`，打包输出至 `dist/build/h5`。如需修改子路径部署，可在 `manifest.config.ts` 的 `h5.router.base` 中配置。
- **微信小程序**：执行 `pnpm build:mp`，打包输出至 `dist/build/mp-weixin`，使用微信开发者工具上传。

## 🤝 参与贡献

开发前请阅读 [贡献指南](CONTRIBUTING.md)。

## 📜 License

[MIT](LICENSE)
