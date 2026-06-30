# Features

`src/features` 只放跨页面复用的业务能力。

放置规则：

- 共享领域数据、组合式函数、复杂交互和与 UI 无关的业务 helper 放在 `src/features/<domain>`。
- 页面私有 helper 放在页面目录内，例如 `src/pages/my/features`。
- 组件私有 helper 放在组件目录内，例如 `src/components/search-overlay/features`。
- 页面私有和组件私有 `features` 目录只允许由所属页面/组件通过相对路径引用。
- 请求模块不放这里，统一放 `src/service/api`。
