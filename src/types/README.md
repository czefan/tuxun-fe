# Types

`src/types` 只放全局声明、工具生成声明和真正跨模块共享的业务契约。

- `*.d.ts`：全局类型声明、第三方模块补丁和插件生成声明。
- `business.ts`：全局共享的业务身份类型。
- API DTO 和分页类型放在 `src/service/api`。
- feature、页面、组件私有类型就近放在各自目录的 `types.ts`。
