# tuxun-fe 文档中心

欢迎查阅图寻前端（`tuxun-fe`）项目文档。

---

## 📚 目录指南

- [项目架构与规范 (architecture.md)](architecture.md)
  - 分层依赖约束与领域隔离规则
  - 服务端与客户端状态管理约定 (`@tanstack/vue-query` & `Pinia`)
  - 全局与局部类型定义放置规范
  - 自动化边界与架构守卫

- [接口契约规约 (contract.md)](contract.md)
  - 契约单一事实源 (`contract/` 目录与 `apifox-import.json`)
  - 通用数据结构、分页规则与常数
  - HTTP 状态码与业务错误码映射

- [构建与部署指南 (deployment.md)](deployment.md)
  - H5 生产构建与 Nginx 容器化/静态部署（SPA 回退）
  - 微信小程序构建与版本发布

- [开发者参与贡献 (../CONTRIBUTING.md)](../CONTRIBUTING.md)
  - 静态校验命令与工作流
  - Git Commit 提交规范与代码风格

- [主项目 README (../README.md)](../README.md)
  - 项目快速开始与基础环境依赖
