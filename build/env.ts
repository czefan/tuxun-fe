export function warnMissingProductionBaseUrl(
  env: Record<string, string>,
  platform: string | undefined,
  mode: string,
) {
  const baseUrl = env.VITE_SERVER_BASEURL?.trim()
  const isMock = env.VITE_ENABLE_MOCK === 'true' || env.VITE_ENABLE_MOCK === 'Y'
  const isProxy = env.VITE_APP_PROXY_ENABLE === 'true'

  if (mode !== 'prod' && mode !== 'production') {
    if (!isMock && !baseUrl && !isProxy) {
      console.warn('[env] 开发环境默认关闭了 Mock 且未配置 VITE_SERVER_BASEURL 或 VITE_APP_PROXY_ENABLE 代理。本地 API 请求可能由于缺乏出口而抛出 404。')
    }
    return
  }

  if ((platform === 'mp-weixin' || platform === 'mp') && !baseUrl && !env.VITE_SERVER_BASEURL__WEIXIN_RELEASE?.trim()) {
    console.warn('[env] VITE_SERVER_BASEURL__WEIXIN_RELEASE is empty. Weixin release requests need an explicit HTTPS API domain.')
    return
  }

  if (platform && platform !== 'h5' && !baseUrl) {
    console.warn(`[env] VITE_SERVER_BASEURL is empty for production ${platform} build. Confirm this platform can request relative API paths.`)
  }

  if (platform === 'h5' && !env.VITE_AMAP_KEY?.trim()) {
    console.warn('[env] VITE_AMAP_KEY is empty for H5 build. Map component will fail back to full screen location selection.')
  }
}
