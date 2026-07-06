import type { Preset } from 'unocss'
import { FileSystemIconLoader } from '@iconify/utils/lib/loader/node-loaders'

// https://www.npmjs.com/package/@uni-helper/unocss-preset-uni
import { presetUni } from '@uni-helper/unocss-preset-uni'
// @see https://unocss.dev/presets/legacy-compat
import { presetLegacyCompat } from '@unocss/preset-legacy-compat'
import {
  defineConfig,
  presetIcons,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'
import { BRAND_PRIMARY_COLOR, BRAND_PRIMARY_DARK_COLOR, BRAND_PRIMARY_LIGHT_COLOR } from './src/styles/constants'

export default defineConfig({
  presets: [
    presetUni({
      attributify: false,
    }),
    presetIcons({
      scale: 1.2,
      warn: true,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
      collections: {
        // 注册本地 SVG 图标集合, 从本地文件系统加载图标
        // 在 './src/static/my-icons' 目录下的所有 svg 文件将被注册为图标，
        // my-icons 是图标集合名称，使用 `i-my-icons-图标名` 调用
        'my-icons': FileSystemIconLoader(
          './src/static/my-icons',
          // 可选的，你可以提供一个 transform 回调来更改每个图标
          (svg) => {
            let svgStr = svg

            // 如果 SVG 文件未定义 `fill` 属性，则默认填充 `currentColor`, 这样图标颜色会继承文本颜色，方便在不同场景下适配
            svgStr = svgStr.includes('fill="')
              ? svgStr
              : svgStr.replace(/^<svg /, '<svg fill="currentColor" ')

            // 如果 svg 有 width, 和 height 属性，将这些属性改为 1em，否则无法显示图标
            svgStr = svgStr
              .replace(/(<svg.*?width=)"(.*?)"/, '$1"1em"')
              .replace(/(<svg.*?height=)"(.*?)"/, '$1"1em"')

            return svgStr
          },
        ),
      },
    }),
    // TODO: check 是否会有别的影响
    // 处理低端安卓机的样式问题
    // 将颜色函数 (rgb()和hsl()) 从空格分隔转换为逗号分隔，更好的兼容性app端，example：
    // `rgb(255 0 0)` -> `rgb(255, 0, 0)`
    // `rgba(255 0 0 / 0.5)` -> `rgba(255, 0, 0, 0.5)`
    presetLegacyCompat({
      commaStyleColorFunction: true,
      legacyColorSpace: true, // by QQ4群-量子蔷薇
      // @菲鸽 unocss 配置中，建议在 presetLegacyCompat 中添加 legacyColorSpace: true，以去除生成的颜色样式中的 in oklch 关键字，现在发现有些渐变色生成不符合预期
    }) as Preset,
  ],
  transformers: [
    // 启用指令功能：主要用于支持 @apply、@screen 和 theme() 等 CSS 指令
    transformerDirectives(),
    // 启用 () 分组功能
    // 支持css class组合，eg: `<div class="hover:(bg-gray-400 font-medium) font-(light mono)">测试 unocss</div>`
    transformerVariantGroup(),
  ],
  shortcuts: [
    {
      'center': 'flex justify-center items-center',
      'u-circle-btn': 'flex items-center justify-center flex-shrink-0 w-62rpx h-62rpx bg-white border-2rpx border-solid border-[rgba(31,27,20,0.08)] rounded-full shadow-[0_8rpx_20rpx_rgba(31,26,18,0.05)] box-border',
      'u-page-viewport': 'safe-bottom-page flex flex-col h-100vh pt-34rpx bg-[#f6f4ef] box-border',
      'u-header-flex': 'flex items-start justify-between gap-18rpx px-24rpx pb-28rpx pt-4rpx',
      'u-list-wrapper': 'flex flex-col gap-18rpx px-24rpx pt-16rpx',
      'u-card-item': 'flex gap-18rpx p-18rpx bg-white border border-solid border-[rgba(31,27,20,0.06)] rounded-18rpx shadow-[0_8rpx_24rpx_rgba(31,27,20,0.05)]',
      'u-card-cover': 'flex-shrink-0 w-150rpx h-150rpx bg-[#eeeeee] rounded-14rpx',
      'u-card-main': 'flex flex-col justify-between flex-1 min-w-0 h-150rpx box-border py-4rpx',
      'u-card-title': 'block line-clamp-2 text-29rpx font-900 leading-[1.35] text-[#1f1b14]',
    },
  ],
  // 动态图标需要在这里配置，或者写在vue页面中注释掉
  safelist: [
    'i-carbon-code',
    'i-carbon-home',
    'i-carbon-user',
    'i-carbon-user-filled',
    'i-carbon-notification',
    'i-carbon-notification-filled',
    'i-carbon-ibm-watson-language-translator',
    'i-carbon-menu',
  ],
  rules: [
    [
      'p-safe',
      {
        padding:
          'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
      },
    ],
    ['pt-safe', { 'padding-top': 'env(safe-area-inset-top)' }],
    ['pb-safe', { 'padding-bottom': 'env(safe-area-inset-bottom)' }],
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
  ],
  theme: {
    colors: {
      /** 主题色，用法如: text-primary */
      'primary': 'var(--wot-color-theme,#0957DE)',
      'brand': BRAND_PRIMARY_COLOR,
      'brand-dark': BRAND_PRIMARY_DARK_COLOR,
      'brand-light': BRAND_PRIMARY_LIGHT_COLOR,
    },
    fontSize: {
      /** 提供更小号的字体，用法如：text-2xs */
      '2xs': ['20rpx', '28rpx'],
      '3xs': ['18rpx', '26rpx'],
    },
  },
  // windows 系统会报错：[plugin:unocss:transformers:pre] Cannot overwrite a zero-length range - use append Left or prependRight instead.
  // 去掉下面的就正常了
  // content: {
  //   /**
  //    * 解决小程序报错 `./app.wxss(78:2814): unexpected unexpected at pos 5198`
  //    * 为什么同时使用include和exclude？虽然看起来多余，但同时配置两者是一种常见的 `防御性编程` 做法。
  //      1. 结构变化保障 : 如果未来项目结构发生变化，某些排除目录可能被移动到包含路径下，exclude配置可以确保它们仍被排除
  //      2. 明确性 : 明确列出要排除的目录使配置意图更加清晰
  //      3. 性能优化 : 避免处理不必要的文件，提高构建性能
  //      4. 防止冲突 : 排除第三方库和构建输出目录，避免潜在的CSS冲突
  //    */
  //   pipeline: {
  //     exclude: [
  //       'node_modules/**/*',
  //       'public/**/*',
  //       'dist/**/*',
  //     ],
  //     include: [
  //       './src/**/*',
  //     ],
  //   },
  // },
})
