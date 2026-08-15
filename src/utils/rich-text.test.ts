import { describe, expect, it } from 'vitest'
import { normalizeRichText } from './rich-text'

describe('normalizeRichText 富文本排版与规范化', () => {
  it('空值与非法输入返回空字符串', () => {
    expect(normalizeRichText('')).toBe('')
    expect(normalizeRichText(null as unknown as string)).toBe('')
    expect(normalizeRichText(undefined as unknown as string)).toBe('')
  })

  it('段落 <p> 自动注入 1.75 黄金行高、10px 下边距与两端对齐', () => {
    const html = '<p>这是第一段文字。</p><p>这是第二段文字。</p>'
    const normalized = normalizeRichText(html)
    expect(normalized).toContain('line-height:1.75')
    expect(normalized).toContain('margin:0 0 10px')
    expect(normalized).toContain('text-align:justify')
  })

  it('列表项 <li> 自动注入 1.65 行高与 4px 间距', () => {
    const html = '<ul><li>条例一</li><li>条例二</li></ul>'
    const normalized = normalizeRichText(html)
    expect(normalized).toContain('<li style="line-height:1.65;margin-bottom:4px">条例一</li>')
  })

  it('媒体与块元素自动注入防溢出样式', () => {
    const html = '<img src="test.jpg"><table><tr><td>内容</td></tr></table><pre>code</pre>'
    const normalized = normalizeRichText(html)
    expect(normalized).toContain('max-width:100%')
    expect(normalized).toContain('table-layout:fixed')
    expect(normalized).toContain('white-space:pre-wrap')
  })

  it('防御注入：已有行内 style 的标签保留原样，不发生重复覆盖', () => {
    const customHtml = '<p style="color: red;">自定义红色段落</p><img style="width: 200px;" src="custom.jpg">'
    const normalized = normalizeRichText(customHtml)
    expect(normalized).toBe(customHtml)
  })
})
