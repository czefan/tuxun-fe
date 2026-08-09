# 网络请求层 (`src/service/request`)

本目录包含 `tuxun-fe` 项目底层网络请求适配与统一拦截逻辑。

---

## 🛠️ 架构与数据流

```text
页面 / Feature 逻辑
    ↓
src/service/api (业务接口入口)
    ↓
src/service/request/index.ts (暴露 request / uploadFile)
    ↓
src/service/request/interceptor.ts (请求/响应拦截器)
    ↓
src/service/request/http.ts (适配 uni.request)
```

---

## ⚙️ 核心逻辑说明

1. **请求适配 (`http.ts`)**：
   - 适配 UniApp 的 `uni.request` API，提供统一的 Promise 接口。
   - 不进行隐式缓存，保证写操作与鉴权状态变更的实时性。

2. **统一拦截器 (`interceptor.ts`)**：
   - **BaseURL 补全**：自动为相对路径补全服务端 baseUrl。
   - **双凭据模式**：Web H5 端自动透传 `tz-sessions` Cookie；小程序/跨域端从 Pinia `authStore` 提取 `session_id` 并添加 `X-Session-Id` 请求头。
   - **统一异常处理**：
     - 当收到 HTTP `401` 或业务鉴权错误码（`code=6`）时，自动触发 `authStore.clearToken()` 并引导重定向至登录页。
     - 遇到其他错误时抛出异常并提示全局 Toast。

3. **OpenAPI 客户端适配 (`openapi.ts`)**：
   - 为 OpenAPI 生成代码提供统一的 fetcher 适配层。

4. **幂等性规约 (`Idempotency-Key`)**：
   - 需要幂等保护的操作（如商品兑换 `POST /api/exchange`），必须在 API/UI 层显式生成并传递 `Idempotency-Key`。
   - 拦截器不会自动注入随机 Key，避免重试时破坏服务端幂等去重逻辑。
