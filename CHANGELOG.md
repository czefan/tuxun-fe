# Changelog

## ...main

### 🚀 Enhancements

- 优化意见反馈页面并新增公告已读/未读状态标记功能 (8b01883)
- **query:** Adopt vue-query (520cd02)
- **arch:** Refactor build configs, standardize mock db, integrate vue-query and finish P1 features (1ac83d6)
- **map:** Align map capabilities, restore components and fix location validation (f269a4f)
- **map:** Clean map-picker, connect query mutations and enable coord transforms (ddf0554)

### 🩹 Fixes

- **ci:** Avoid pnpm version mismatch in workflow (df0fdb2)
- **tooling:** Tolerate ignored formatted files (6826ffc)
- **ci:** Upgrade node to v22 and generate types before check (aac1a66)
- Isolate question transition by platform (469ec3d)
- Narrow unocss shortcut arrays (3d8f15f)
- **request:** Unpack resp and map error codes (cee687f)
- **contract:** Correct contract constraints, modularize msw handlers and eliminate as-any types (c254964)
- **arch:** Add boundaries lint, smart compress and env refactor (637b92a)
- **runtime:** Integrate view transition, comment section, useUserInfo and clean phantom deps (c8d39b2)
- **deps:** Configure msw subdependencies and rollup external isolation (fdfc82b)
- **mock:** Decouple mock database and refactor msw handlers (1337c1a)
- **tab-bar:** Fix navigation icon rendering and active index unwrapping (82af07d)
- **request:** Resolve interceptor syntax crash and enable dev mock (8998c42)
- **store:** Clean user search history on logout and close photo preview on unload (50bad0d)

### 💅 Refactors

- **request:** Centralize api endpoints and adapters (ae994ba)
- **ui:** Extract page composables and brand tokens (554de45)
- **mall:** 重构商城模块并合并 composable，将页面样式迁移为 UnoCSS (6788c8f)
- **style:** 将各业务页面与公共组件的传统 SCSS 样式重构为 UnoCSS (a189b44)
- **style:** Migrate global scss styles to unocss shortcuts and restructure styles directory (f55a36f)
- **style:** 使用 UnoCSS @apply 重构样式并优化 uno.config.ts 依赖 (0694b5e)
- **service:** Consolidate api and mock data flow (3fbdeca)
- **request:** Remove legacy vue-query shim (649a9ec)
- **build:** Remove empty layout plugin (9ee9386)
- **build:** Remove idle restart plugin (acbf433)
- **build:** Stop scanning missing hooks directory (9513a7e)
- **build:** Unify component auto resolution (2b2a7e3)
- **style:** Trim tabbar icon safelist (b5d501f)
- **i18n:** Keep native page and tabbar locale (357e2f2)
- **types:** Move business contracts into api (52dc730)
- **arch:** Introduce feature domains (88b1118)
- **api:** Rewrite modules against new contract (b364b1e)
- **arch:** Move stores and components into domains (12a97a0)
- **arch:** Extract app shell (451943c)
- **motion:** Replace custom transition with view transitions (2819203)
- **pages:** Align photo and activity pages with domain queries (a535689)
- **pages:** Align user and auth pages (f3457dc)
- **pages:** Align submission and attempt pages (318a45f)
- **pages:** Align notice, score and mall pages (734b1ec)
- **contract:** Enforce schema types, full msw contract tests and domain boundaries (d343a8e)
- **architecture:** Enforce boundaries, pnpm catalog, and ts checks (7e3d28f)
- **ui:** Optimize waterfall rendering, view transitions, and clean dead code (941549b)
- **arch:** Optimize location picker and resolve layer boundaries (032944e)

### 📖 Documentation

- Update project workflow and agent rules (06a097f)
- 优化并精简 README 和贡献指南 (fffd9e9)
- Document service and mock boundaries (1cc7a28)
- Codify directory promotion rules (a4c262f)
- **agents:** Consolidate agent rules (ced43f9)
- **arch:** Update architecture rules and clean unused variables (7ce8aad)

### 🏡 Chore

- **init:** 初始化图寻前端工程 (04bbc82)
- **tooling:** Add project checks and ci gates (9fbca94)
- Remove support and files for non-weixin/h5 platforms (86c77c9)
- **tooling:** 将 .agents 规则移出版本控制并加入 ignore (c5f4613)
- **uni:** Upgrade toolchain to 5.15 (6e9bc4e)
- **config:** Fix stale project configs (4d7eee1)
- **api:** Generate contract types (db598be)
- **cleanup:** Remove obsolete mock assets and dead scss files (8750120)
- **infra:** Add knip config, virtual waterfall and update architecture docs (9a3f0ef)
- **infra:** Update build plugins, eslint rules, and dependency lock (0a901d9)

### ✅ Tests

- **mock:** Migrate to msw handlers (85da137)

### 🎨 Styles

- Unify naming and sfc block order (48aa02d)

### ❤️ Contributors

- Czefan ([@czefan](https://github.com/czefan))

## ...main

### 🚀 Enhancements

- 优化意见反馈页面并新增公告已读/未读状态标记功能 (8b01883)
- **query:** Adopt vue-query (520cd02)
- **arch:** Refactor build configs, standardize mock db, integrate vue-query and finish P1 features (1ac83d6)
- **map:** Align map capabilities, restore components and fix location validation (f269a4f)
- **map:** Clean map-picker, connect query mutations and enable coord transforms (ddf0554)

### 🩹 Fixes

- **ci:** Avoid pnpm version mismatch in workflow (df0fdb2)
- **tooling:** Tolerate ignored formatted files (6826ffc)
- **ci:** Upgrade node to v22 and generate types before check (aac1a66)
- Isolate question transition by platform (469ec3d)
- Narrow unocss shortcut arrays (3d8f15f)
- **request:** Unpack resp and map error codes (cee687f)
- **contract:** Correct contract constraints, modularize msw handlers and eliminate as-any types (c254964)
- **arch:** Add boundaries lint, smart compress and env refactor (637b92a)
- **runtime:** Integrate view transition, comment section, useUserInfo and clean phantom deps (c8d39b2)
- **deps:** Configure msw subdependencies and rollup external isolation (fdfc82b)
- **mock:** Decouple mock database and refactor msw handlers (1337c1a)
- **tab-bar:** Fix navigation icon rendering and active index unwrapping (82af07d)
- **request:** Resolve interceptor syntax crash and enable dev mock (8998c42)
- **store:** Clean user search history on logout and close photo preview on unload (50bad0d)

### 💅 Refactors

- **request:** Centralize api endpoints and adapters (ae994ba)
- **ui:** Extract page composables and brand tokens (554de45)
- **mall:** 重构商城模块并合并 composable，将页面样式迁移为 UnoCSS (6788c8f)
- **style:** 将各业务页面与公共组件的传统 SCSS 样式重构为 UnoCSS (a189b44)
- **style:** Migrate global scss styles to unocss shortcuts and restructure styles directory (f55a36f)
- **style:** 使用 UnoCSS @apply 重构样式并优化 uno.config.ts 依赖 (0694b5e)
- **service:** Consolidate api and mock data flow (3fbdeca)
- **request:** Remove legacy vue-query shim (649a9ec)
- **build:** Remove empty layout plugin (9ee9386)
- **build:** Remove idle restart plugin (acbf433)
- **build:** Stop scanning missing hooks directory (9513a7e)
- **build:** Unify component auto resolution (2b2a7e3)
- **style:** Trim tabbar icon safelist (b5d501f)
- **i18n:** Keep native page and tabbar locale (357e2f2)
- **types:** Move business contracts into api (52dc730)
- **arch:** Introduce feature domains (88b1118)
- **api:** Rewrite modules against new contract (b364b1e)
- **arch:** Move stores and components into domains (12a97a0)
- **arch:** Extract app shell (451943c)
- **motion:** Replace custom transition with view transitions (2819203)
- **pages:** Align photo and activity pages with domain queries (a535689)
- **pages:** Align user and auth pages (f3457dc)
- **pages:** Align submission and attempt pages (318a45f)
- **pages:** Align notice, score and mall pages (734b1ec)
- **contract:** Enforce schema types, full msw contract tests and domain boundaries (d343a8e)
- **architecture:** Enforce boundaries, pnpm catalog, and ts checks (7e3d28f)
- **ui:** Optimize waterfall rendering, view transitions, and clean dead code (941549b)
- **arch:** Optimize location picker and resolve layer boundaries (032944e)

### 📖 Documentation

- Update project workflow and agent rules (06a097f)
- 优化并精简 README 和贡献指南 (fffd9e9)
- Document service and mock boundaries (1cc7a28)
- Codify directory promotion rules (a4c262f)
- **agents:** Consolidate agent rules (ced43f9)
- **arch:** Update architecture rules and clean unused variables (7ce8aad)

### 🏡 Chore

- **init:** 初始化图寻前端工程 (04bbc82)
- **tooling:** Add project checks and ci gates (9fbca94)
- Remove support and files for non-weixin/h5 platforms (86c77c9)
- **tooling:** 将 .agents 规则移出版本控制并加入 ignore (c5f4613)
- **uni:** Upgrade toolchain to 5.15 (6e9bc4e)
- **config:** Fix stale project configs (4d7eee1)
- **api:** Generate contract types (db598be)
- **cleanup:** Remove obsolete mock assets and dead scss files (8750120)
- **infra:** Add knip config, virtual waterfall and update architecture docs (9a3f0ef)
- **infra:** Update build plugins, eslint rules, and dependency lock (0a901d9)

### ✅ Tests

- **mock:** Migrate to msw handlers (85da137)

### 🎨 Styles

- Unify naming and sfc block order (48aa02d)

### ❤️ Contributors

- Czefan ([@czefan](https://github.com/czefan))
