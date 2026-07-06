# 贡献指南

请在开发和提交 PR 前，遵守以下设计约定与规范。

---

## 🛡️ 代码质量与类型检查

在提交前，建议在本地运行以下检查：

```bash
pnpm check # 运行完整检查（资源校验、Lint、类型检查、单元测试）
```

- `pnpm check`：串行运行静态资源校验、一键 Lint、TS 类型检查和单元测试（CI 核心流程）。
- `pnpm check:parallel`：上述检查的并行版本，适合本地快速运行。
- `pnpm lint`：并行运行 `lint:quick` (oxlint) 和 `lint:eslint` (eslint)。
- `pnpm lint:quick`：运行 `oxlint` 极速检查。
- `pnpm lint:eslint`：单独运行 ESLint 风格检查。
- `pnpm lint:fix`：自动修复 JS/TS/Vue 的代码规范问题。
- `pnpm type-check`：使用 `vue-tsc` 校验 TypeScript 类型。
- `pnpm test`：启动 Vitest 交互测试。
- `pnpm test:run`：单次运行 Vitest 测试（CI 流程）。
- `pnpm check:assets`：校验静态资源大小。
- `pnpm fmt`：使用 `oxfmt` 格式化 `css/scss/html/json/jsonc/md`。
- `pnpm fmt:check`：检查 `oxfmt` 覆盖文件是否已格式化。

> [!NOTE]
>
> 1. JS/TS/Vue 文件仍以 ESLint 格式化为主，避免 `oxfmt` 与 ESLint 规则冲突。
> 2. Git hooks (`simple-git-hooks`) 会在提交时自动触发 pre-commit (`lint-staged`) 和 commit-msg 校验。

---

## 📐 业务开发与设计规范

### 1. 项目结构规划

```text
tuxun-fe/
├── src/
│   ├── components/                  # 全局公共组件（通过 easycom 或 vite-plugin-uni-components 自动挂载）
│   ├── features/                    # 业务域模块（领域模型、fixtures、复杂交互、域内 store/composable）
│   │   ├── question-transition/     # 题目卡片到详情页的共享元素转场能力
│   │   └── ...                      # questions、history、notice 等业务域
│   ├── composables/                 # 跨业务通用组合式函数（授权、地图、系统信息、请求状态等）
│   ├── layouts/                     # 约定式页面布局结构目录
│   ├── locale/                      # 国际化 i18n 多语言包
│   ├── pages/                       # 主包页面（底栏 TabBar 直属的核心页面）
│   │   ├── index/                   # 首页
│   │   ├── my/                      # 个人中心首页
│   │   ├── history/                 # 往期活动
│   │   └── notice/                  # 消息通知
│   ├── subPages/                    # 分包页面（登录、活动、商城、投稿、题目详情等）
│   ├── router/                      # uni-app 导航守卫与登录策略，不是 VueRouter
│   ├── service/                     # 业务请求入口：api/ 放接口模块，request/ 放请求适配
│   ├── static/                      # 静态资源目录（采用跨端安全命名）
│   ├── store/                       # Pinia 全局状态管理
│   ├── styles/                      # 全局公共样式、设计变量和 Sass mixins
│   ├── types/                       # 全局身份类型与插件生成声明；API、feature、组件类型就近放置
│   ├── utils/                       # 通用工具函数；有业务语义的工具需按域放入 features/composables
│   ├── App.vue                      # 跨端生命周期控制，全局样式/拦截器挂载点
│   ├── main.ts                      # 项目开发脚手架初始化与 Vue 实例挂载
│   ├── pages.json                   # 编译自动生成的页面与分包路由规则文件（请勿手动修改此文件）
│   └── uni.scss                     # 自动注入全局 Sass 的桥接配置文件
└── package.json
```

### 2. 路由与分包约定

1. **约定式路由**：
   - 采用 `@uni-helper/vite-plugin-uni-pages` 约定式路由。在页面 Vue 文件中通过 `definePage` 声明，编译自动生成 `src/pages.json`。
   - 自动生成的路由类型和路径保存在 `src/types/uni-pages.d.ts`，跳转常量维护在 `src/router/routes.ts`。
2. **分包与体积限制 (2MB 隔离)**：
   - 主包 (`pages/` 目录) 仅放置 TabBar 核心入口页：`index`、`history`、`notice`、`my`，其余二级页面均放入 `subPages/`。
   - 分包专属的业务逻辑必须放置在其各自的分包目录中。严禁在主包静态引用分包专属文件，防分包代码被打包入主包。

### 3. 静态资源预算

主包仅存放轻量图标、tabbar及启动必需图片。活动图、海报图、详情大图优先走远程资源或 CDN，不放入 `src/static`。

`pnpm check:assets` 默认限制：

- 单个静态资源 <= `300KB`
- `src/static` 媒体文件总量 <= `2MB`

临时调整阈值：

```sh
STATIC_ASSET_SINGLE_LIMIT=512000 STATIC_ASSET_TOTAL_LIMIT=3145728 pnpm check:assets
```

### 4. API 与网络通信

1. **统一入口**：
   - 业务代码统一从 `@/service/api` 导入接口，不要直接调用底层网络库。
   - 本地 fixtures、领域常量、复杂业务交互放入 `src/features/*` 或页面私有目录，不要放入 `src/service`。
2. **请求器与拦截器**：
   - `src/service/api` 仅定义接口，`src/service/request` 处理 baseURL、Token 注入、状态码过滤、响应校验及全局 Toast 报错。
   - 401 响应时清除登录态和 Token，并重定向至登录页。
3. **接口模型与 UI 解耦**：
   - 统一使用 OpenAPI 生成的类型，避免手写重复 DTO。
   - API 返回模型以 `*Dto` 结尾。页面展示如需调整字段命名、聚合或格式化，应在本地 adapter / ViewModel 中转换，避免前端与后端字段耦合。
   - 强绑定组件使用 DTO，通用组件使用 `Pick<Dto, ...>` 或派生 Props，只暴露最小必要字段。

### 5. 样式与 UnoCSS

1. **优先使用 UnoCSS**：
   - 页面布局、边距、颜色等应优先使用 UnoCSS，避免编写大量局部 CSS。
2. **避免 `uni.scss` 注入冗余**：
   - `src/uni.scss` 仅允许导入变量（Variables）和宏（Mixins），严禁在其中编写具体的 CSS 选择器。
   - 具体 CSS 样式在 `src/App.vue` 或 `src/styles/` 中引入。

### 6. 交互与设计规范

1. **自定义导航栏**：需妥善解决小程序胶囊与状态栏适配，确保异形屏下标题绝对居中。
2. **防过度设计**：相似但有特异性的微小 UI 模块（如排序选项卡、搜索栏），建议各自独立实现，避免过度封装导致未来迭代耦合。
3. **列表图片与 Fixture**：
   - 瀑布流展示时，分列依据应是图片原始宽高和文字估算高度。
   - 示例大图统一存放在 `src/static/images` 或对应分包资源目录，并在数据源配置中声明原始宽高以防止图片拉伸变形。

### 7. 共享元素转场动画 (H5 专享)

- **跨端隔离**：通过条件编译（`#ifdef H5`）进行隔离。转场图层（Overlay）仅在 H5 启用，小程序端退化为原生路由跳转。
- **滚动偏置**：返回退栈瞬间，克隆容器应用 `translate3d(0, -scrollTop, 0)` 以实现无缝过渡。
- **模块边界**：转场逻辑统一存放在 `src/features/question-transition`，外部仅通过该目录入口引入，不跨目录引用内部文件。

---

## 📝 Git 提交规范

请遵循 **Angular Commit 规范**：

```text
<type>(<scope>): <subject>
```

### Type 类型

- `feat`：新增功能 (feature)
- `fix`：修复缺陷 (bug fix)
- `docs`：文档变更 (如修改 README、API 接口文档)
- `style`：代码格式调整 (不影响逻辑的变更，如空格、缩进等)
- `refactor`：重构代码
- `perf`：性能优化
- `test`：新增测试
- `chore`：构建过程或辅助工具、依赖库的变动

### 示例

```bash
git commit -m "feat(auth): 适配 CAS 登录鉴权拦截器"
git commit -m "fix(styles): 修复 UnoCSS 引起的首页瀑布流左右间距不齐问题"
```
