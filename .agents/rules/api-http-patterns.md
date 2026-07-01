---
trigger: glob
description: HTTP request configurations and API specs for request, vue-query, and interceptors
globs: src/service/api/**/*.ts, src/service/request/**/*.ts
---

# API 和 HTTP 请求规范

## HTTP 请求封装

- 业务请求底层适配在 [src/service/request/](file:///home/chai_/Club/tuxun/tuxun-fe/src/service/request) 目录下
- `基础请求适配` - [src/service/request/http.ts](file:///home/chai_/Club/tuxun/tuxun-fe/src/service/request/http.ts)
- `vue-query` - [src/service/request/vue-query.ts](file:///home/chai_/Club/tuxun/tuxun-fe/src/service/request/vue-query.ts)
- 请求拦截器在 [src/service/request/interceptor.ts](file:///home/chai_/Club/tuxun/tuxun-fe/src/service/request/interceptor.ts)
- 对外统一仅通过 `src/service/request/index.ts` 暴露 `request`
- 支持请求重试、统一异常捕获和错误处理

## API 接口规范

- API 接口定义在 [src/service/api/](file:///home/chai_/Club/tuxun/tuxun-fe/src/service/api) 目录下
- OpenAPI 客户端代码自动生成输出至 `src/service/api/generated/`
- 按功能模块组织 API 文件，使用 TypeScript 定义请求和响应类型

## 示例代码结构

```typescript
// API 接口定义
export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userInfo: UserInfo;
}

// 统一请求链路方式
export const login = (params: LoginParams) =>
  request<LoginResponse>({
    url: "/api/login",
    method: "POST",
    data: params,
  });
```

## 错误处理

- 统一错误处理在拦截器中配置
- 支持网络错误、业务错误、认证错误等
- 自动处理 token 过期和刷新
