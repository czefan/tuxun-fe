import type { Rule } from 'unocss'

export const rules: Rule[] = [
  [
    'p-safe',
    {
      padding:
        'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
    },
  ],
  ['pt-safe', { 'padding-top': 'env(safe-area-inset-top)' }],
  ['pb-safe', { 'padding-bottom': 'env(safe-area-inset-bottom)' }],
  // 数字字体栈单一数据源 (Single Source of Truth)
  // 注册为 unocss rule 供模板与 shortcuts (如 u-meta-time) 引用。
  // 多词字体名用反斜杠转义空格（DIN\ Alternate）而非引号：
  // unocss/esbuild 压缩时会剥掉 font-family 的引号，而无引号多词 family-name
  // 不是合法的 custom-ident；转义空格是标准写法，压缩环节不会改写它。
  [
    /^font-numeric$/,
    (_, { rawSelector }) => `
      .${rawSelector} {
        font-family: DIN\\ Alternate, SF\\ Pro\\ Display, SF\\ Pro\\ Text, Inter, -apple-system,
          BlinkMacSystemFont, Segoe\\ UI, Roboto, Helvetica\\ Neue, sans-serif;
        font-variant-numeric: tabular-nums;
        letter-spacing: -0.01em;
      }
    `,
  ],
  [
    /^scrollbar-none$/,
    (_, { rawSelector }) => `
      .${rawSelector}::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
        -webkit-appearance: none !important;
        background: transparent !important;
      }
    `,
  ],
  [
    /^animate-scale-in$/,
    (_, { rawSelector }) => `
      @keyframes scale-in {
        from {
          transform: scale(0.9);
          opacity: 0;
        }
        to {
          transform: scale(1);
          opacity: 1;
        }
      }
      .${rawSelector} {
        animation: scale-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }
    `,
  ],
  [
    /^animate-slide-up$/,
    (_, { rawSelector }) => `
      @keyframes slide-up {
        from {
          transform: translateY(100%);
        }
        to {
          transform: translateY(0);
        }
      }
      .${rawSelector} {
        animation: slide-up 0.23s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
      }
    `,
  ],
]
