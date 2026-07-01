---
trigger: model_decision
description: High-level overview of the unibest project, technology stack, directory layout, and key config files.
---

# unibest 项目概览

这是一个基于 uniapp + Vue3 + TypeScript + Vite5 + UnoCSS 的跨平台开发框架。

## 项目特点

- 支持 H5、小程序、APP 多平台开发
- 使用最新的前端技术栈
- 内置约定式路由、layout布局、请求封装、登录拦截、自定义tabbar等功能
- 无需依赖 HBuilderX，支持命令行开发

## 核心配置文件

- [package.json](file:///home/chai_/Club/tuxun/tuxun-fe/package.json) - 项目依赖和脚本配置
- [vite.config.ts](file:///home/chai_/Club/tuxun/tuxun-fe/vite.config.ts) - Vite 构建配置
- [pages.config.ts](file:///home/chai_/Club/tuxun/tuxun-fe/pages.config.ts) - 页面路由配置
- [manifest.config.ts](file:///home/chai_/Club/tuxun/tuxun-fe/manifest.config.ts) - 应用清单配置
- [uno.config.ts](file:///home/chai_/Club/tuxun/tuxun-fe/uno.config.ts) - UnoCSS 配置
- [eslint.config.mjs](file:///home/chai_/Club/tuxun/tuxun-fe/eslint.config.mjs) - ESLint 代码检查与格式化配置
- [openapi-ts-request.config.ts](file:///home/chai_/Club/tuxun/tuxun-fe/openapi-ts-request.config.ts) - OpenAPI 客户端代码生成配置

## 主要目录结构

- `src/pages/` - 页面文件
- `src/components/` - 组件文件
- `src/layouts/` - 布局文件
- `src/service/api/` - 业务 API 接口服务
- `src/service/request/` - 底层 HTTP 请求封装与拦截器
- `src/store/` - 状态管理
- `src/styles/` - 全局公共样式与混入配置
- `src/tabbar/` - 底部导航栏
- `src/App.ku.vue` - 全局根组件（类似 App.vue 里面的 template作用）

## 开发命令

- `pnpm dev` - 开发 H5 版本
- `pnpm dev:mp` - 开发微信小程序
- `pnpm dev:mp-alipay` - 开发支付宝小程序（含钉钉）
- `pnpm dev:app` - 开发 APP 版本
- `pnpm build` - 构建生产版本
- `pnpm type-check` - 纯 TypeScript 类型检查
