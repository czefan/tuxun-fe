# 业务逻辑域 (`src/features`)

本目录采用 **Domain-collected 业务域自治架构**，将属于同一业务领域的逻辑、接口、状态与 ViewModel 集中收敛管理。

---

## 📂 域结构划分范式

以 `src/features/activity` 为例：

```text
src/features/activity/
├── api.ts         # 域专属 API 封装
├── query.ts       # 基于 @tanstack/vue-query 的 Query / Mutation Hooks
├── store/         # 域内部状态（若有）
├── types.ts       # 域 View Model 与 ViewModel 转化函数
└── components/    # 仅本业务域使用的私有组件
```

---

## 🔒 域间隔离约束

1. **内聚原则**：业务相关的 ViewModel 格式化、数据校验与 Vue Query 缓存失效逻辑必须收敛在各域的 `query.ts` 与 `api.ts` 内。
2. **禁止交叉依赖**：`src/features/user` **严禁** 直接 import `src/features/activity` 内的代码。
3. **编排下沉**：如果多个域需要协同交互（例如点击用户头像触发活动跳转），请在 `src/pages/` 编排层或 `src/app/` 外壳层组合，不要在 feature 内部互引。
