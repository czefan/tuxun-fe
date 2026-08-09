# 组合式函数 (`src/composables`)

本目录存放全站通用的 Vue 3 组合式逻辑函数（Composables）。

---

## 📌 常见 Composables 说明

- **`useAuth.ts`**：身份校验、登录触发与全局退出逻辑封装。
- **`useLocation.ts`**：小程序与 H5 的地理位置定位与权限申请处理。
- **`useSystemInfo.ts`**：屏幕尺寸、异形屏安全区域与顶部状态栏适配。

---

## ⚠️ 编写约束

1. 必须遵循 Vue 组合式函数命名规范（以 `use` 开头）。
2. 保持逻辑高内聚，具有具体业务域特征的 Composables 建议放入对应的 `src/features/*` 域中。
