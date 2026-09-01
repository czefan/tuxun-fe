# 通用公共组件 (`src/components`)

本目录存放全站通用的 UI 基础组件。

---

## ⚙️ 规范与引入方式

1. **组件引入与依赖**：
   - 配置了 `vite-plugin-uni-components` 插件（用于第三方 UI 库如 Wot Design Uni 组件的自动解析）。
   - **项目内公共组件统一采用显式按需 `import`**（例：`import LikeButton from '@/components/like-button/like-button.vue'`），以保证依赖关系清晰可追溯、IDE 重构友好以及 Knip 死代码检测的准确性。
   - 全局组件类型声明由插件生成在 `src/types/components.d.ts`。

2. **组件设计原则**：
   - **零业务耦合**：不得直接依赖特定业务 Feature（如 `features/user` 或 `features/activity`）。
   - **小程序胶囊适配**：导航栏相关组件必须正确兼容微信小程序顶部状态栏与胶囊控件高度。
   - **加载态统一准则**：固定结构的网格布局（如瀑布流、商城宫格、活动卡片）使用骨架屏（Skeleton）；不定结构的动态列表使用圆形 Loading 转圈。

3. **核心通用组件收录**：
   - `form-location-picker`：表单选点与地图微调控件
   - `like-button`：通用点赞/取消点赞防抖动胶囊按钮
   - `photo-location-view`：题目机位地图/全屏展示组件
   - `progressive-image`：渐进式图片展示组件（缩略图秒开占位 + 原图瞬时清晰直切覆盖，防闪烁与同图重复下载）
   - `status-tab-swiper`：跨页面/状态平滑左右滑屏的通用 Tab 切换器
   - `status-tag`：题目/审核/核销状态通用标签
