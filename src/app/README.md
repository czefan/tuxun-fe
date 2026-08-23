# 应用外壳层 (`src/app`)

本目录定义 `tuxun-fe` 的应用外壳（App Shell）与顶层运行时容器。

---

## 📂 子模块职责

- **`components/`**：应用全局外壳 UI 组件
  - `app-global-provider/`：根级全局 Provider 容器，包裹全局状态横幅与根组件挂载点。
  - `network-bar/`：全局网络离线检测与状态提醒横幅。
- **`lifecycle/`**：应用全局生命周期逻辑
  - `init.ts`：应用启动初始化（设备状态、服务器时间同步偏移、网络监听等）。
- **`tab-bar/`**：主包页面自定义底部导航栏
  - `main-tab-bar.vue`：自定义 TabBar UI 渲染与安全区适配。
  - `config.ts`：TabBar 页面路由映射与图标配置。
  - `store.ts`：TabBar 激活索引与状态管理。

---

## ⚠️ 架构约束

1. 属于**编排与外壳层**：允许协调调用 `src/features/*`，但业务域（`src/features/*`）与基础公共层严禁反向依赖 `src/app/`。
2. 小程序环境需保证自定义 TabBar 与原生 TabBar 策略正确对应（由 `config.ts` 中 `custom: true` 统一控制）。
