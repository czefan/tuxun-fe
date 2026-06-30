import { t } from '@/locale'
import { currRoute } from '@/router/page'
import { isNativeTabbar, tabbarList } from './config'
import { isPageTabbar } from './store'

// h5 中一直可以生效，小程序里面默认是无法动态切换的，这里借助vue模板自带响应式的方式
// 直接替换 %xxx% 为 t('xxx')即可
export function getI18nText(key: string) {
  // 获取 %xxx% 中的 xxx
  const match = key.match(/%(.+?)%/)
  if (match) {
    key = match[1]
  }
  return t(key)
}

export function setTabbarItem() {
// 只有使用原生Tabbar才需要 setTabbarItem
// 而且只有当前页是tabbar页才能设置
  const { path } = currRoute()
  if (isNativeTabbar && isPageTabbar(path)) {
    tabbarList.forEach((item, index) => {
      uni.setTabBarItem({
        index,
        text: getI18nText(item.text || ''),
      })
    })
  }
}
