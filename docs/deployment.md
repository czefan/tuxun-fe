# 构建与部署指南

本文档说明 `tuxun-fe` 项目在 H5 与微信小程序平台上的打包构建与部署发布流程。

## 运行环境与升级策略

- 最低要求 Node `>=24` 和 pnpm `>=12`，范围声明在 `package.json#engines`，不另设 `.node-version`。
- 当前推荐 Node `24.21.0`、pnpm `12.6.0`。`packageManager` 固定 pnpm 精确版本；GitHub Actions 与 Drone 固定 Node 构建版本，以便复现。
- 更新 pnpm 时同步 `packageManager` 与其生成的锁文件工具链记录，运行 `pnpm install --frozen-lockfile`、`pnpm check` 和双端构建；不要手动删除锁文件里的工具链部分。
- 截至 2026-09-29，[Node 官方版本列表](https://nodejs.org/dist/index.json)最新 LTS 为 24.21.0，最新 Current 为 26.10.0；优先采用 LTS。[npm 官方 pnpm stable](https://registry.npmjs.org/pnpm/latest)为 12.6.0。
- Uni-app、Vue、Vite 存在编译器版本约束，不与 Node / pnpm 一起盲目升级大版本。升级框架时单独验证 H5 开发、微信分包和登录 / 定位 / 上传。

安装使用 `pnpm install --frozen-lockfile`。版本范围由标准 `engines` 声明，不添加自定义安装检查脚本；建议使用上述已验证版本，未来主版本仍需重新验证。

Drone 沿用现有 HTTP 镜像源。发布先复制资源，最后以同目录唯一临时文件重命名替换 `index.html`，减少新入口先于新资源上线的窗口；旧 hash 资源保留供已打开页面继续使用。完整回滚仍需服务器保留发布备份。

---

## 🌐 H5 端部署 (SPA)

### 1. 构建指令

```bash
pnpm build:h5
```

- 打包产物输出至：`dist/build/h5`
- 如需设置部署子路径，设置 `VITE_APP_PUBLIC_BASE`；Vite 的资源路径与 `manifest.config.ts` 的路由 base 共用此值。

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

## 原生地图选址

`chooseLocation` 报错 `errno: 112` 时，在微信后台「设置 → 服务内容声明 → 用户隐私保护指引」补充 **收集你选择的位置信息**，保存后约 5 分钟生效。该后台声明不能由代码中的 `requiredPrivateInfos` 替代。前端统一显示原始错误，不按错误码定制处理。

参考：[微信官方隐私协议开发指南](https://developers.weixin.qq.com/miniprogram/dev/framework/user-privacy/PrivacyAuthorize.html)。

---

## 🛠️ 性能与体积分析

开发过程中可通过以下命令分析产物体积分布：

```bash
# 分析 H5 构建体积
pnpm analyze:h5

# 分析小程序各分包体积
pnpm analyze:mp
```

## 本次升级验证（2026-09-29）

验证环境为 Node 24.21.0、pnpm 12.6.0：

- 原项目和全新临时目录的 `pnpm install --frozen-lockfile` 通过；后者安装了全部依赖并执行 prepare。
- `pnpm check` 的契约、分层、静态资源、两套 lint、未使用代码、类型与测试共八项检查通过。
- H5、微信小程序生产构建及各 18 页产物校验通过；小程序严格体积检查通过。Mock 开发服务启动成功，首页和入口模块 HTTP 请求成功。
- 发布命令在临时目录验证了新资源复制、入口替换、旧 hash 资源保留、临时文件清理和文件可读权限；未执行线上发布。
- 修复了并行检查偶发读取已删除的 Vite 临时配置文件的问题，ESLint 与 Git 均忽略 `*.timestamp-*.mjs/cjs`，真正的配置源码仍参与检查。

Node 26 等更高主版本未在本轮验证；`engines` 的最低版本声明不等于已经验证所有未来版本。Docker / Drone 平台上的完整发布仍需由实际 CI 运行确认。
