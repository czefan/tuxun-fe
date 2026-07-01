# 贡献指南

欢迎为图寻前端项目贡献代码！在您开始编写代码和提交 PR 之前，请仔细阅读并遵守以下各项设计约定与规范。

---

## 🛡️ 代码质量与类型检查

在日常开发以及提交 Commit 之前，请优先在本地执行以下命令以检查代码规范与 TypeScript 类型：

```bash
# 一键运行完整项目检查（包含资源校验、Lint、类型检查、单元测试）
pnpm check
```

- `pnpm check`：整合静态资源检查、一键 Lint、TypeScript 类型校验和单元测试，默认以串行模式运行。此命令也作为 CI 中的核心校验流程，推荐在 Push 前执行。
- `pnpm check:parallel`：以并行模式运行完整项目检查，适合在本地开发时快速运行。
- `pnpm lint`：会并行运行 `lint:quick` (oxlint) 和 `lint:eslint` (eslint)。
- `pnpm lint:quick`：只运行 `oxlint`，适合开发中极速检查。
- `pnpm lint:eslint`：单独执行 ESLint 对项目文件进行代码风格和规范检查。
- `pnpm lint:fix`：自动修复 JS、TS、Vue 中可修复的代码规范问题。
- `pnpm type-check`：运行 `vue-tsc` 进行完整的 TypeScript 类型检查，确保多平台打包时不会因类型错误中断。
- `pnpm test`：以交互/监听模式 (watch mode) 启动 Vitest 单元测试。
- `pnpm test:run`：单次运行所有 Vitest 单元测试，通常在 CI 和提交检查中使用。
- `pnpm check:assets`：运行静态资源大小校验，防止提交超过预算的图片/资源文件。
- `pnpm fmt`：使用 `oxfmt` 格式化 `css/scss/html/json/jsonc/md`。
- `pnpm fmt:check`：检查 `oxfmt` 覆盖文件是否已格式化。

> [!NOTE]
>
> 1. 当前 JS、TS、Vue 文件仍以 ESLint 作为主格式化入口，避免 `oxfmt` 与现有 ESLint 风格规则互相改动。
> 2. 项目配置了 `simple-git-hooks`，在执行 `git commit` 时会自动触发 Pre-commit 钩子（运行 lint-staged）和 Commit-msg 钩子（校验 commit 消息规范）。

---

## 📁 业务开发与设计规范

为了在日常迭代开发中保持代码的一致性，请严格遵循以下各项设计约定与规范。

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

### 2. 路由与分包约定 (Routing & Subpackaging)

1. **约定式路由**：
   - 本项目废弃了手动配置 `pages.json` 的传统方式，转而采用 `@uni-helper/vite-plugin-uni-pages` 提供的约定式路由。
   - 所有页面注册与分包声明，应优先在页面 Vue 文件中通过 `definePage` 声明，编译时会自动生成 `src/pages.json`。
   - 自动生成的路由类型和路径将保存在 `src/types/uni-pages.d.ts`，业务跳转常量统一维护在 `src/router/routes.ts`。
2. **分包与包体积优化 (2MB 隔离规则)**：
   - 主包页面（即 `pages/` 目录）只放置底部 TabBar 关联的核心入口页：`index`、`history`、`notice`、`my`。其余业务二级页一律划入 `subPages/`。
   - 分包专用的本地业务域逻辑目录必须**严格存放在其各自的分包目录中**。严禁在主包（如 `pages/`、`components/`）中静态引用分包专属的文件或方法，防止分包代码被打包进主包公共依赖，导致主包体积超出限制。

### 3. 静态资源预算

小程序主包资源优先放轻量图标、tabbar、启动必需图片。活动图、海报图、详情大图优先走远程资源或 CDN，不放入 `src/static`。

`pnpm check:assets` 默认限制：

- 单个静态资源不超过 `300KB`
- `src/static` 图片/媒体总量不超过 `2MB`

如需临时调整静态资源预算阈值，可使用环境变量覆盖：

```sh
STATIC_ASSET_SINGLE_LIMIT=512000 STATIC_ASSET_TOTAL_LIMIT=3145728 pnpm check:assets
```

### 4. API 层与网络通信约定

1. **统一入口**：
   - 业务代码统一从 `@/service/api` 导入接口方法，避免页面或组件直接调用底层网络库。
   - 页面当前需要的本地 fixtures、领域常量、复杂业务交互放在 `src/features/*` 或页面私有 `features` 目录，不要放入 `src/service`
2. **请求器与拦截器职责**：
   - `src/service/api` 只定义业务接口；`src/service/request` 处理基础 URL 拼接、`Authorization` 令牌注入、HTTP 状态码过滤、统一响应结构校验、全局 Toast 报错提示与 OpenAPI request adapter。
   - 接口 401 未授权时，应触发全局清除 Pinia 用户登录态与本地 Token，并跳转回登录引导页。
3. **接口模型与页面模型解耦**：
   - OpenAPI 生成类型是接口边界的唯一类型来源。`src/service/api`、请求 adapter、页面数据源必须优先使用生成类型，不要手写重复 DTO。
   - 页面可以尽量透传生成类型；业务强绑定组件可以直接使用对应 DTO；通用展示组件应使用 `Pick<Dto, ...>`、派生 Props 或本地 ViewModel，只暴露最小必要字段，避免后端字段泄漏到纯 UI 组件。
   - API 返回模型使用 `*Dto` 后缀。页面展示如需调整字段命名、聚合或格式化，应在本地 adapter / ViewModel 中转换，避免前端 UI 展现层与后端数据库字段过度耦合。

### 5. 样式与原子化 CSS 开发规范

1. **使用 UnoCSS 优先**：
   - 本项目深度集成 `UnoCSS` 原子化 CSS 框架。在页面排版布局、边距、颜色及常规交互开发中，应**优先使用 UnoCSS 工具类**，避免编写大量重复的局部 CSS 规则。
2. **避免全局 SCSS 注入冗余**：
   - `src/uni.scss` 是 Uni-app 的全局注入配置文件，**只允许导入设计令牌变量（Variables）和 Sass 宏（Mixins）**。严禁在 `uni.scss` 中编写任何具体的 CSS 选择器样式，以防其被编译复制到全站每一个 Vue 组件中导致包体积膨胀。
   - 产生具体 CSS 样式规则的文件，需在 `src/App.vue` 或 `src/styles/` 中统一引入，确保全局只被挂载一次。

### 6. 核心交互与设计规范对齐

1. **多端物理对齐与自定义顶栏**：
   - 自定义导航栏需妥善解决小程序胶囊适配与系统状态栏偏置，保证在各种异形屏下物理标题绝对居中。
2. **防过度设计与抽象原则**：
   - 严禁“为了复用而复用”。对于不同业务分包、不同页面中相似的微小 UI 模块（如排序选项卡、搜索栏），若交互或排版略有特异性，应保持页面内部独立实现，防止未来业务独立迭代时耦合过深。
3. **列表图片展示与 Fixture 规范**：
   - 首页题目列表等采用双列瀑布流展示时，分列依据应是图片原始宽高和文字估算高度。
   - fixture 示例大图不要散落在页面目录或根级临时目录，统一整理到 `src/static/images` 或对应分包资源目录，并在数据源配置文件中声明原始宽高，由页面计算比例展示，防止图片拉伸变形。

### 7. 共享元素转场动画规范 (Transition System) (H5 专享)

项目针对 H5 端定制了高精度的卡片与详情页共享元素转场动画系统。若在项目中启用此交互，请确保：

- **跨端执行策略**：通过条件编译（`#ifdef H5`）进行物理隔离。转场图层（Overlay）仅限在 H5 平台中启用，小程序端一律退化为原生路由跳转与退栈逻辑，以确保最佳响应与内存表现。
- **视口切片对齐**：返回退栈瞬间，Overlay 需要获取详情页滚动高度 `scrollTop`，在克隆容器上应用 `translate3d(0, -scrollTop, 0)` 偏置以在折叠动画中实现无缝的缩页过渡。
- **模块边界**：转场状态、渲染、Overlay 控制、列表跳转 composable 和样式统一放在 `src/features/question-transition`。页面与组件只允许从 `@/features/question-transition` 这个公共入口导入能力，不直接跨目录引用内部文件。

---

## 📝 Git 提交规范 (Git Commit Message)

为便于多人协作并保持清晰的版本更迭日志，在提交 Git 记录时请务必遵循 **Angular Commit 规范**：

```text
<type>(<scope>): <subject>
```

常见 `type` 类型：

- `feat`：新增功能 (feature)
- `fix`：修复缺陷 (bug fix)
- `docs`：文档变更 (如修改 README、API 接口文档)
- `style`：代码格式调整 (不影响运行逻辑的变更，如空格、缩进等)
- `refactor`：重构代码
- `perf`：性能优化
- `test`：新增测试
- `chore`：构建过程或辅助工具、依赖库的变动

#### 示例：

```bash
git commit -m "feat(auth): 适配 CAS 登录鉴权拦截器"
git commit -m "fix(styles): 修复 UnoCSS 引起的首页瀑布流左右间距不齐问题"
```
