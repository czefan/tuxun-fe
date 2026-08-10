# 分包页面 (`src/subPages`)

本目录存放所有二级业务分包页面，以实现小程序包体积隔离与按需加载。

---

## 📂 分包模块目录

- `activity/`：活动详情与报名
- `auth/`：登录回调页（`callback.vue`）与小程序内嵌 OAuth 认证页（`webview.vue`）
- `contribute/`：投稿发布
- `mall/`：积分商城与兑换记录
- `my/`：个人中心二级页（我的答案、我的投稿、积分明细、意见反馈、关于与帮助）
- `notice/`：通知与互动消息详情
- `question/`：题目详情与地图作答、提交作答

---

## 📐 规则与约定

1. 在页面 Vue 文件中通过 `definePage` 标记分包配置（如 `subPackages: ['subPages']`）。
2. 分包专属的组件或逻辑就近放在各自子目录下，不要向上污染主包 `components/`。
