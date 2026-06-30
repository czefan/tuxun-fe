# Service

`src/service` 是业务请求的唯一入口。

- `api/`：按业务模块拆分接口方法。
- `api/types.ts`：API 模块共享的分页等通用接口类型。
- `request/`：封装 `uni.request` / `uni.uploadFile`、拦截器、OpenAPI adapter 和请求类型。

不要在这里放 fixtures、页面私有逻辑或展示层 adapter。共享领域数据放 `src/features/*`，页面私有逻辑放页面自己的 `features` 目录。
