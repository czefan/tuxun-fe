import { t } from '@/locale'
import { customTabBarList } from './config'

export function getTranslatedTabBarList(userLevel: number = 1) {
  return customTabBarList
    .filter(item => item.type === 'publish' || !item.minLevel || userLevel >= item.minLevel)
    .map(item => ({
      ...item,
      text: (item.text && item.text.startsWith('%') && item.text.endsWith('%'))
        ? t(item.text.slice(1, -1) as any)
        : (item.text ?? ''),
    }))
}
