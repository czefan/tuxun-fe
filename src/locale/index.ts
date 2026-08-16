import en from './en.json'
import zhHans from './zh-Hans.json'

const messages: Record<string, Record<string, string>> = { 'zh-Hans': zhHans, en }

export function initLocale() {
  if (typeof navigator !== 'undefined') {
    const lang = navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'zh-Hans'
    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem('uni-app-locale') !== lang)
        localStorage.setItem('uni-app-locale', lang)
      if (typeof uni !== 'undefined' && uni.setLocale && uni.getLocale?.() !== lang)
        uni.setLocale(lang)
    }
    catch {}
  }
}

initLocale()

export function t(key: string) {
  const current = (typeof navigator !== 'undefined' && navigator.language) || (typeof uni !== 'undefined' && uni.getLocale?.()) || 'zh-Hans'
  const lang = current.toLowerCase().startsWith('en') ? 'en' : 'zh-Hans'
  return messages[lang]?.[key] ?? zhHans[key as keyof typeof zhHans] ?? key
}
