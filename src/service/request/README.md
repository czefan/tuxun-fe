# 网络请求层 (`src/service/request`)

本目录包含 `tuxun-fe` 项目底层网络请求适配与统一错误处理逻辑。

---

## 🛠️ 架构与数据流

```text
业务域 (src/features/*/api.ts)
    ↓
src/service/request/index.ts (request() 统一入口)
    ↓
src/service/request/http.ts (适配 uni.request)
    ↓
uni.request / uni.uploadFile (经 interceptor.ts 拦截)
```

---

## 📂 文件职责

- **`index.ts`**：`request()` 业务请求入口，统一调用 `buildFullUrl` 补齐地址后转交 `http()`。对外仅暴露 `request` 与 `upload`（`uploadFile` 为其别名）。
- **`url.ts`**：`buildFullUrl` 平台守卫 URL 构建 —— 绝对地址直通；相对路径补 `/api` 前缀；H5 开启代理时走 `/fg-api` 前缀；否则补环境 base URL。`upload.ts` 也从这里引入，避免循环依赖。
- **`env.ts`**：后端服务源 `getEnvBaseUrl()`（小程序按 `envVersion` 区分 develop / trial / release）与契约基础路径 `API_BASE_PATH`。
- **`http.ts`**：`uni.request` 的 Promise 适配 —— Mock 模式先确保 MSW 就绪、同步服务器时间偏移、解析契约响应（`success === true && code === 0` 时解包 `resp`，否则走统一错误处理）。
- **`interceptor.ts`**：`request` / `uploadFile` 的统一拦截 —— query 序列化、60s 超时、存在 `sessionId` 且 `auth !== false` 时注入 `X-Session-Id` 头。
- **`upload.ts`**：`uni.uploadFile` 的 Promise 封装 —— 校验文件参数、补齐 URL；`PUT` 方法通过 `X-HTTP-Method-Override` 头重写传输。
- **`error.ts`**：`ApiRequestError` 错误类型（携带 `code` / `statusCode` / `data`）。
- **`error-code.ts`**：业务错误码 → 文案映射、`handleResponseError` 统一错误处理与 Toast 去重（`showToastDeduplicated`）。
- **`shared.ts`**：401 静默处理 —— 清空本地会话但不跳转，用户停留在当前页继续浏览游客可见内容。
- **`types.ts`**：`RequestOptions` 等请求参数类型定义。

---

## ⚙️ 关键约定

1. **URL 构建**：业务域一律传相对路径（如 `/contents/{key}`），由 `buildFullUrl` 统一补前缀，禁止各域自行拼接 base URL。
2. **会话头**：小程序/跨域端在存在 `sessionId` 时自动注入 `X-Session-Id`；H5 同源部署下走浏览器 Cookie。
3. **幂等性 (`Idempotency-Key`)**：需要幂等保护的操作（如商品兑换）由页面在发起时显式生成并传递，拦截器不自动注入随机 Key，避免重试时破坏服务端幂等去重。
