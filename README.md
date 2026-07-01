# 图寻前端项目（tuxun-fe）

本项目是图寻前端项目，基于现代化的 [unibest](https://unibest.tech/) 模板构建，实现多端兼容与更高效的开发体验。

## 技术栈 (Tech Stack)

本项目依托 Uni-app 跨端框架生态，采用现代化前端工具链开发，核心技术选型如下：

- **底层开发模板**：[unibest](https://unibest.tech/) (uniapp 开发模板)
- **应用核心框架**：[Uni-app](https://uniapp.dcloud.net.cn/) (基于 Vue 3 组合式 API / Composition API)
- **构建及打包工具**：[Vite 5](https://vitejs.dev/) (提供开发热更新与现代化构建服务)
- **开发语言**：[TypeScript](https://www.typescriptlang.org/) (全站类型安全支持)
- **全局状态管理**：[Pinia](https://pinia.vuejs.org/) (轻量且符合 Composition API 的状态管理库)
- **UI 核心组件库**：[Wot Design Uni](https://wot-ui.cn/) (即 `wot-ui-v2`)
- **原子化 CSS 框架**：[UnoCSS](https://unocss.dev/) (原子化 CSS 引擎，取代传统的繁重样式编写)
- **网络通信层**：基于 `src/service/api` 与 `src/service/request` 的统一请求链路
- **包管理工具**：[pnpm](https://pnpm.io/) (高效、省空间的硬链接包管理器)

## 环境要求 (Prerequisites)

在运行与打包该项目之前，请确保您的本地开发环境已满足以下要求：

- **Node.js**：建议使用 `v22.13.0` 或更高版本（LTS 版本）。
- **包管理工具**：必须使用 [pnpm](https://pnpm.io/) (`>= v11.0.0`)。项目配置有首选包管理器检测（`only-allow pnpm`），请避免使用 npm / yarn 以防锁文件冲突。

## 🚀 快速开始

1. **安装依赖**：`pnpm i`

2. **运行项目**：
   - **Web 平台**：执行 `pnpm dev` (或 `pnpm dev:h5`)，然后浏览器打开 [http://localhost:9000/](http://localhost:9000/)。
   - **微信小程序**：执行 `pnpm dev:mp`，然后打开微信开发者工具导入本项目，导入目录选择本项目的 `dist/dev/mp-weixin` 文件夹。

## 🔗 发布

- **Web 平台**：执行 `pnpm build:h5`，打包后的文件在 `dist/build/h5`，可以放到 Web 服务器（如 Nginx）运行。如果最终不是放在根目录，可以在 `manifest.config.ts` 文件的 `h5.router.base` 属性进行修改。
- **微信小程序**：执行 `pnpm build:mp`，打包后的文件在 `dist/build/mp-weixin`，然后通过微信开发者工具导入，并点击右上角的“上传”按钮进行上传。

---

## 🤝 参与贡献

在您开始编写代码之前，请先阅读我们的 [贡献指南 (CONTRIBUTING.md)](CONTRIBUTING.md)。

---

## 📄 License

本项目基于 [MIT](LICENSE) 许可协议开源。
