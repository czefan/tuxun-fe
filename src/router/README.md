# 路由与导航守卫 (`src/router`)

本目录定义 UniApp 项目路由跳转常量、拦截守卫与登录控制逻辑。

---

## 🛠️ 路由工作机制

1. **约定式路由**：
   - 使用 `@uni-helper/vite-plugin-uni-pages` 插件。在页面文件 (`pages/*.vue` 或 `subPages/*.vue`) 中通过 `definePage` 块定义路由与页面配置。
   - **禁止手动修改 `src/pages.json`**，该文件由 Vite 编译时自动生成。
   - 自动生成的路由类型保存在 `src/types/uni-pages.d.ts` 中。

2. **跳转常量集中管理 (`routes.ts`)**：
   - 包含主包与分包页面的枚举及强类型跳转路径方法，避免在业务代码中硬编码字符串 URL。

3. **导航守卫与登录策略 (`index.ts`)**：
   - 挂载 `uni.navigateTo` / `uni.redirectTo` 拦截器。
   - 未登录状态访问需鉴权页面时，阻断跳转并重定向至登录 Modal / 登录页面。
