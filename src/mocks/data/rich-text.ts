/**
 * 从 HTML / 富文本 / 纯文本内容中截取前 N 个字符的摘要提取算法
 */
export function generateContentPreview(content: string, length = 30): string {
  if (!content) {
    return ''
  }
  const plainText = content.replace(/<[^>]+>/g, '').trim()
  if (plainText.length <= length) {
    return plainText
  }
  return `${plainText.substring(0, length)}...`
}
