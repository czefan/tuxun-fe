/// <reference types="vite/client" />
/// <reference types="vite-svg-loader" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
  /** 网站标题，应用名称 */
  readonly VITE_APP_TITLE: string
  /** 后台接口地址 */
  readonly VITE_SERVER_BASEURL: string
  /** 是否开启 MSW Mock */
  readonly VITE_ENABLE_MOCK?: string
  /** 是否注入 eruda 调试台，默认关闭（500KB 远程脚本，会明显拖慢页面） */
  readonly VITE_APP_ERUDA?: string
  /** Mock 延迟 (ms) */
  readonly VITE_MOCK_DELAY?: string
  /** 微信小程序开发版后台接口地址，不配置则使用 VITE_SERVER_BASEURL */
  readonly VITE_SERVER_BASEURL__WEIXIN_DEVELOP?: string
  /** 微信小程序体验版后台接口地址，不配置则使用 VITE_SERVER_BASEURL */
  readonly VITE_SERVER_BASEURL__WEIXIN_TRIAL?: string
  /** 微信小程序正式版后台接口地址，不配置则使用 VITE_SERVER_BASEURL */
  readonly VITE_SERVER_BASEURL__WEIXIN_RELEASE?: string
  /** 部署子路径（默认 /；子路径部署时如 /doc/，vite base 与 OAuth 回调 URL 均依赖它） */
  readonly VITE_APP_PUBLIC_BASE: string
  /** H5是否需要代理 */
  readonly VITE_APP_PROXY_ENABLE: 'true' | 'false'
  /** H5是否需要代理，需要的话有个前缀 */
  readonly VITE_APP_PROXY_PREFIX: string
  /** 是否清除console */
  readonly VITE_DELETE_CONSOLE: string
  /** 高德地图 Key。H5 端 <map> 组件必须有它才能渲染，为空时降级为纯坐标展示 */
  readonly VITE_AMAP_KEY?: string
  /** 高德安全密钥，仅开发/内网直连时使用；生产走 VITE_AMAP_SERVICE_HOST 代理 */
  readonly VITE_AMAP_SECURITY_JSCODE?: string
  /** 高德服务代理地址，配置后 jscode 不会出现在前端产物里 */
  readonly VITE_AMAP_SERVICE_HOST?: string
  /** tz-oauth 授权服务地址（生产 https://oauth.tiaozhan.com） */
  readonly VITE_OAUTH_BASE_URL?: string
  /** 本服务的 OAuth Client ID（在 tz-oauth 管理端注册） */
  readonly VITE_OAUTH_CLIENT_ID?: string
  /** 小程序专用：H5 站点源（用于拼接静态中转页 URL） */
  readonly VITE_MP_AUTH_ORIGIN?: string
  /** 微信小程序提审时是否开启测试登录通道 ('true' | 'false') */
  readonly VITE_SHOW_AUDIT_LOGIN?: string

  // 更多环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare const __VITE_APP_PROXY__: 'true' | 'false'
