# 请求库

当前项目约定业务代码只走一条主请求链路：

- 页面 / feature 调用 `src/service/api`
- `src/service/api` 调用 `src/service/request`
- `src/service/request/http.ts` 适配 `uni.request`
- `src/service/request/interceptor.ts` 统一处理 baseUrl、query、token 和超时

`src/service/request` 只放请求基础能力，不放业务接口。
对外只从 `src/service/request/index.ts` 暴露 `request` 和 `uploadFile`；`http.ts` 是内部实现，不作为业务调用入口。

OpenAPI 生成代码默认输出到 `src/service/api/generated`，并通过 `src/service/request/openapi.ts` 适配这里的 `request` 实现。
`src/service/request/vue-query.ts` 仅保留给旧生成路径兼容，不是业务页面的直接请求入口。

## 缓存边界

`src/service/request/http.ts` 和 `request` 不做隐式缓存，避免 POST/PUT/DELETE 或鉴权态变化被误缓存。
需要服务端状态缓存时，在页面或 feature 的组合层使用 `useRequest` 的 `cache` 选项显式开启：

```ts
useRequest(fetchProfile, {
  cache: {
    key: 'profile',
    cacheTime: 5 * 60 * 1000,
  },
})
```

缓存 key 相同的并发请求默认会被合并；接口发生 mutation 后，用 `invalidateRequestCache(key)` 清理相关缓存。
输入防抖仍放在 UI/composable 层处理，不放进请求库。
