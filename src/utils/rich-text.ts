/**
 * 富文本内容规范化：给后端 HTML 注入移动端中文排版（1.75倍行高、10px段间距）与防溢出样式。
 * 覆盖所有经 rich-text 渲染的内容（通知详情、公告弹窗、帮助、积分规则）。
 */
export function normalizeRichText(html: string): string {
  return (html || '')
    .replace(/<p(?![^>]*\sstyle=)/gi, '<p style="line-height:1.75;margin:0 0 10px;text-align:justify"')
    .replace(/<li(?![^>]*\sstyle=)/gi, '<li style="line-height:1.65;margin-bottom:4px"')
    .replace(/<img(?![^>]*\sstyle=)/gi, '<img style="max-width:100%;height:auto;display:block;margin:8px 0"')
    .replace(/<table(?![^>]*\sstyle=)/gi, '<table style="max-width:100%;table-layout:fixed;word-break:break-word"')
    .replace(/<pre(?![^>]*\sstyle=)/gi, '<pre style="max-width:100%;white-space:pre-wrap;word-break:break-word"')
}
