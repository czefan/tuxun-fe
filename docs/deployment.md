# 构建与部署指南

本文档说明 `tuxun-fe` 项目在 H5 与微信小程序平台上的打包构建与部署发布流程。

---

## 🌐 H5 端部署 (SPA)

### 1. 构建指令

```bash
pnpm build:h5
```

- 打包产物输出至：`dist/build/h5`
- 如需设置部署子路径，可在 `manifest.config.ts` 中的 `h5.router.base` 进行配置。

### 2. Nginx 服务器配置

针对 History 模式路由，Nginx 必须配置路径重定向以防止刷新 404（参考仓库中的 `deploy/nginx.conf.example`）：

```nginx
server {
    listen       80;
    server_name  tuxun.example.com;

    location / {
        root   /usr/share/nginx/html/h5;
        index  index.html;
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理配置
    location /api/ {
        proxy_pass http://tuxun-backend-service:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## 📱 微信小程序部署

### 1. 构建指令

```bash
pnpm build:mp
```

- 打包产物输出至：`dist/build/mp-weixin`

### 2. 上传发布

1. 打开**微信开发者工具**。
2. 导入 `dist/build/mp-weixin` 目录。
3. 检查并确认服务器域名配置（包括 request 域名与 uploadFile 域名）。
4. 点击右上角「上传」提交代码至微信小程序管理后台。
5. 亦可执行命令行上传：

   ```bash
   pnpm upload:mp
   ```

---

## 🛠️ 性能与体积分析

开发过程中可通过以下命令分析产物体积分布：

```bash
# 分析 H5 构建体积
pnpm analyze:h5

# 分析小程序各分包体积
pnpm analyze:mp
```
