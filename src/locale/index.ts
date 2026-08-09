import en from './en.json'
import zhHans from './zh-Hans.json'

type MessageMap = Record<string, string>

const localeMessages: Record<string, MessageMap> = {
  en,
  'zh-Hans': zhHans,
}
const fallbackMessages: MessageMap = zhHans

export function t(key: string) {
  const messages = localeMessages[uni.getLocale()] ?? fallbackMessages
  return messages[key] ?? fallbackMessages[key] ?? key
}
