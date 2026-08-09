import type { Plugin } from 'vite'

interface ErudaOptions {
  open?: boolean
}

/**
 * 注入 eruda 移动端调试台。
 *
 * 默认不开：它是一个 500KB 的远程脚本，放在 `<head>` 里会阻塞解析，
 * eruda.init() 还会挂钩 console / XHR / DOM 变更，页面整体会明显变卡。
 * 需要时用 `VITE_APP_ERUDA=true pnpm dev` 打开。
 */
export function vitePluginEruda(options: ErudaOptions = {}): Plugin {
  return {
    name: 'vite-plugin-eruda',
    transformIndexHtml(html) {
      if (!options.open) {
        return html
      }
      // defer + DOMContentLoaded：不阻塞首屏解析
      return html.replace(
        '</head>',
        `  <script src="https://cdn.jsdelivr.net/npm/eruda" defer></script>
  <script defer>window.addEventListener('DOMContentLoaded', () => window.eruda && window.eruda.init())</script>
</head>`,
      )
    },
  }
}
