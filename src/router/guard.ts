/**
 * uni-app 路由拦截器注册
 */
const chooseLocationInterceptor = {
  invoke(_options: unknown) {
    return true
  },
}

export const routeInterceptor = {
  install() {
    uni.addInterceptor('chooseLocation', chooseLocationInterceptor)
  },
}
