# 全局常量 (`src/constants`)

本目录存放项目全局静态常量与配置字典。

---

## 📌 放置规范

- **`index.ts`**：常量统一出口（re-export `storage.ts`）。
- **`storage.ts`**：本地存储 key 集中管理 —— `StorageKey`（登录回跳、公告已读等）、登出清理清单 `AuthCleanupStorageKeys`、搜索历史前缀 `SearchHistoryKeyPrefix`。
- **业务常量**：具体业务特征的常量（如活动状态映射、积分规则）建议放在对应 `src/features/*/constants.ts` 中，保持高内聚。
