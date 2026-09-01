import type { Preset } from 'unocss'
import { icons as carbonIcons } from '@iconify-json/carbon'
import { FileSystemIconLoader } from '@iconify/utils/lib/loader/node-loaders'

// https://www.npmjs.com/package/@uni-helper/unocss-preset-uni
import { presetUni } from '@uni-helper/unocss-preset-uni'
// @see https://unocss.dev/presets/legacy-compat
import { presetLegacyCompat } from '@unocss/preset-legacy-compat'
import { defineConfig, presetIcons, transformerDirectives, transformerVariantGroup } from 'unocss'

import { rules, shortcuts, theme, transitions } from './src/styles/uno'

export default defineConfig({
  // 显式声明配置文件依赖，当子配置文件修改时自动触发 UnoCSS 热更新，无需重启服务
  configDeps: [
    './src/styles/uno/index.ts',
    './src/styles/uno/theme.ts',
    './src/styles/uno/rules.ts',
    './src/styles/uno/shortcuts.ts',
    './src/styles/uno/transitions.ts',
  ],
  presets: [
    presetUni({
      attributify: false,
    }),
    presetIcons({
      scale: 1.2,
      warn: true,
      extraProperties: {
        display: 'inline-block',
        'vertical-align': 'middle',
      },
      collections: {
        carbon: () => carbonIcons,
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
    transformerVariantGroup(),
  ],
  shortcuts: [...shortcuts, ...transitions],
  // safelist 只放「UnoCSS 静态扫描扫不到」的类名。
  // 默认扫描管线是 /\.(vue|svelte|[jt]sx|vine.ts|...)/，纯 .ts 不在内，
  // 所以 tab-bar/config.ts 与 pages/my/menu-groups.ts 里的图标必须在此登记。
  // 写在 .vue 模板里的 i-carbon:xxx 能被扫到，不要往这里加。
  safelist: [
    // 底部导航栏 (src/app/tab-bar/config.ts)
    'i-carbon-flag',
    'i-carbon-flag-filled',
    'i-carbon-notification',
    'i-carbon-notification-filled',
    'i-carbon-user',
    'i-carbon-user-filled',
    // 个人中心菜单 (src/pages/my/menu-groups.ts)
    'i-carbon:camera',
    'i-carbon:task',
    'i-carbon:currency-dollar',
    'i-carbon:store',
    'i-carbon:help',
    'i-carbon:chat',
    'i-carbon:information',
  ],
  rules,
  theme,
  // 触发重新编译的标记
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
