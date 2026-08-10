# 项目前端架构与分层规范

本文档定义 `tuxun-fe` 项目的依赖倒置架构（Domain-collected / Layered Architecture）、目录职责划分与分层约束。

---

## 📂 目录结构与职责划分

```text
src/
├── app/                         # 应用外壳层（TabBar / NavBar 容器及启动声明周期）
├── components/                  # 基础公共 UI 组件（通用轻量组件）
├── composables/                 # 跨业务通用组合式函数（如授权、设备适配、交互状态）
├── constants/                   # 全局常量定义
├── features/                    # 业务逻辑域（按业务聚合逻辑、Query Hooks、API 客户端与 View Model）
├── locale/                      # 国际化 i18n 多语言配置
├── mocks/                       # Mock API 与测试夹具数据
├── pages/                       # 主包页面（底栏 TabBar 核心直属页面）
├── router/                      # 页面路由拦截与导航守卫
├── service/                     # 网络服务与契约处理
│   ├── auth/                    # tz-oauth 授权登录流程（跳转、state 校验、回跳）
│   ├── contract/                # OpenAPI 生成的契约类型 (schema.d.ts) 与 VM 映射
│   ├── query/                   # Vue Query client / Query Key 工厂 / 分页钳制
│   └── request/                 # 适配 uni.request / uploadFile 的底层请求库与拦截器
├── store/                       # Pinia 客户端全局状态（如用户会话态、客户端点赞态等）
├── styles/                      # 全局公共样式、设计变量与 Sass mixins
├── subPages/                    # 分包页面（非核心业务页面，如详情、投稿、商城等）
├── types/                       # 全局类型声明 (*.d.ts) 与插件生成声明
└── utils/                       # 纯工具函数（业务无关）
```

---

## 🏛️ 分层依赖约束表

为防止模块间相互耦合与循环依赖，项目严格遵守下述依赖约束：

| 分层           | 匹配路径                                                                                                                      | 允许依赖 `features` | 允许依赖 `contract` | 职责与约束说明                                                                    |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------- | --------------------------------------------------------------------------------- |
| **页面编排层** | `src/pages/`<br>`src/subPages/`                                                                                               | ✅                  | ❌                  | Vue 视图与路由页面。**严禁越过业务域直连 `contract` 原始定义**。                  |
| **应用外壳层** | `src/app/`                                                                                                                    | ✅                  | ❌                  | 协调全局 UI 外壳与启动生命周期。属于编排层。                                      |
| **业务逻辑域** | `src/features/*`                                                                                                              | 仅限制在本域        | ✅                  | 业务逻辑、Query Hooks、API 客户端及 View Model 统一收敛处。**域间禁止交叉依赖**。 |
| **基础公共层** | `src/components/`<br>`src/composables/`<br>`src/utils/`<br>`src/constants/`<br>`src/styles/`<br>`src/router/`<br>`src/store/` | ❌                  | ✅                  | 底层通用 UI、纯 Utility、Store 状态与全局配置。**严禁反向依赖 `features`**。      |
| **契约协议层** | `src/service/contract/`                                                                                                       | ❌                  | 自包含              | 后端 API 接口契约定义、Raw Schema 类型与网络层封装。                              |

---

## 🔒 静态与运行时守护

依赖规则由自动化校验探针实时守护（可通过提交或 CI 触发）：

1. **ESLint 边界规则 (`eslint.config.mjs`)**：IDE 实时校验 `boundaries/dependencies` 违规。
2. **Python 边界脚本 (`scripts/check-boundaries.py`)**：执行 `pnpm check:boundaries` 独立检测分层关系。
3. **契约一致性校验 (`scripts/check-contract.py`)**：执行 `pnpm check:contract` 校验 API 路径与 operationId。
4. **运行时装配守卫 (`src/tests/runtime-assembly.test.ts`)**：验证组件装配与状态响应性。

---

## 📦 状态管理与数据流约定

### 1. 服务端状态 (Server State)

- **统一使用 `@tanstack/vue-query`**（`useQuery` / `useMutation`），禁止在页面中直接调用 API 函数。
- 自动化失效与缓存规则写在各业务域的 `query.ts` 中。
- **Query Key 规范**：集中使用 `src/service/query/keys.ts` 中的 `qk` 定义，禁止在域内自定义字符串 Key。
- **响应性计算**：`queryKey` 必须包含响应性依赖，如 `computed(() => qk.photo.list(params))`，**严禁在 setup 中使用 `.value` 提取静态快照**。

### 2. 客户端状态 (Client State)

- 使用 **Pinia** 集中管理本地会话与偏好设置（如 `src/store/auth.ts` 管理会话凭据与登录状态——本项目为 cookie 会话，`sessionId` / `userId` 为准，token 恒为空；`features/user` 管理用户信息与 ViewModel）。

---

## 🏷️ 类型放置约定 (`types`)

- **全局声明 (`src/types/*.d.ts`)**：存放全局类型补丁、环境声明与 Vite 插件自动生成类型（如 `uni-pages.d.ts`）。
- **契约类型 (`src/service/contract/schema.d.ts`)**：OpenAPI 生成类型，由 `pnpm gen:api-types` 自动维护，禁止手动修改。
- **私有与业务类型**：Feature、页面及组件的专属类型，就近存放在各自目录下的 `types.ts`。
