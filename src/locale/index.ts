import en from './en.json'
import zhHans from './zh-Hans.json'

type MessageMap = Record<string, string>

const messages: Record<string, MessageMap> = {
  'zh-Hans': zhHans,
  en,
}

// 浏览器环境下若检测到英文环境，自动同步 Uni-App 运行时语言（驱动 H5 原生顶栏）
if (typeof uni !== 'undefined' && typeof uni.setLocale === 'function' && typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('en')) {
  try {
    if (uni.getLocale?.() !== 'en') {
      uni.setLocale('en')
    }
  }
  catch {}
}

export function t(key: string) {
  const current = (typeof navigator !== 'undefined' && navigator.language)
    || (typeof uni !== 'undefined' && uni.getLocale?.())
    || 'zh-Hans'
  const lang = current.toLowerCase().startsWith('en') ? 'en' : 'zh-Hans'
  return messages[lang]?.[key] ?? zhHans[key as keyof typeof zhHans] ?? key
}
