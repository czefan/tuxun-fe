# 请求库

当前项目约定业务代码只走一条主请求链路：

- 页面 / feature 调用 `src/service/api`
- `src/service/api` 调用 `src/service/request`
- `src/service/request/http.ts` 适配 `uni.request`
- `src/service/request/interceptor.ts` 统一处理 baseUrl、query、token 和超时

`src/service/request` 只放请求基础能力，不放业务接口。
对外只从 `src/service/request/index.ts` 暴露 `request` 和 `uploadFile`；`http.ts` 是内部实现，不作为业务调用入口。
`src/service/request/vue-query.ts` 是 OpenAPI 生成代码使用的 request adapter，不是业务页面的直接请求入口。
