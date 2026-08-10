/**
 * 富文本内容规范化：给后端下发的 HTML 注入防溢出行内样式。
 *
 * 覆盖对象：所有经 rich-text 渲染的后端富文本（三个内容位、公告弹窗、
 * 通知详情），保证长 URL / 连续英文串 / 表格 / 代码块 / 大图不横向溢出容器。
 *
 * 为什么用行内 style 而不是 class：小程序端 rich-text 是原生组件，
 * 内部节点不继承外部 CSS（class 也被丢弃），只有继承属性与行内样式能传下去；
 * H5 端内容为真实 DOM，行内样式同样生效——两端表现一致。
 *
 * 负向前瞻避免重复注入：后端内容若已给标签写了 style，重复属性只保留第一个，
 * 注入反而失效。
 */
export function normalizeRichText(html: string): string {
  return (html || '')
    .replace(/<img(?![^>]*\sstyle=)/gi, '<img style="max-width:100%;height:auto;display:block"')
    .replace(/<table(?![^>]*\sstyle=)/gi, '<table style="max-width:100%;table-layout:fixed;word-break:break-word"')
    .replace(/<pre(?![^>]*\sstyle=)/gi, '<pre style="max-width:100%;white-space:pre-wrap;word-break:break-word"')
}
