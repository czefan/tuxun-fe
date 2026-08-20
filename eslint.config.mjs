import path from 'node:path'
import uniHelper from '@uni-helper/eslint-config'
import boundaries from 'eslint-plugin-boundaries'

export default uniHelper({
  unocss: true,
  vue: true,
  markdown: false,
  plugins: {
    boundaries,
  },
  settings: {
    'unocss': {
      configPath: path.resolve('./uno.config.ts'),
    },
    // boundaries 依赖 import 解析结果来判定被依赖方属于哪一层。
    // 不配 resolver 的话 `@/xxx` 一律解析失败 → 规则静默放行，
    // 而本项目几乎所有 import 都走 `@/` 别名，等于整条守卫失效。
    'import/resolver': {
      typescript: { project: './tsconfig.json' },
      node: { extensions: ['.js', '.ts', '.vue'] },
    },
    // 顺序即优先级：先匹配到的 type 生效。contract 必须排在 service 前面，
    // 否则 src/service/contract/** 会被归成 service，pages→contract 的策略永远不触发。
    'boundaries/elements': [
      // mode: 'file' 必须保留。默认 folder 模式只看元素所在目录，
      // src/service/contract/** 的文件会先被 service 规则吃掉，pages→contract 永不触发。
      // v7 提示用 partialMatch: false 取代 mode，但实测两者语义不等价——
      // 换成 partialMatch 后 pages/subPages 压根匹配不上，三条策略里有一条静默失效。
      // 宁可留一行 deprecation 告警，也不要一条不报错的守卫。
      { type: 'contract', pattern: 'src/service/contract/**/*', mode: 'file' },
      { type: 'service', pattern: 'src/service/**/*', mode: 'file' },
      { type: 'pages', pattern: 'src/pages/**/*', mode: 'file' },
      { type: 'subPages', pattern: 'src/subPages/**/*', mode: 'file' },
      // features 保持 folder 模式，才能用 capture 取出域名做跨域判定
      { type: 'features', pattern: 'src/features/*', capture: ['domain'] },
      // app 是应用外壳（tabbar / navbar / 启动生命周期），和 pages 一样属于**编排层**，
      // 允许依赖 features；但同样不许越过 features 直接摸 contract。
      // 它必须单独分出来，否则会被下面的 shared 规则误伤。
      { type: 'app', pattern: 'src/app/**/*', mode: 'file' },
      { type: 'shared', pattern: 'src/{components,composables,utils,constants,styles,router,store}/**/*', mode: 'file' },
    ],
  },
  ignores: [
    '**/uni_modules/',
    '**/nativeplugins/',
    'dist',
    'auto-import.d.ts',
    'uni-pages.d.ts',
    'src/pages.json',
    'src/manifest.json',
    'src/service/contract/schema.d.ts',
    'apifox-import.json',
  ],
  rules: {
    'no-useless-return': 'off',
    'no-console': 'off',
    'no-unused-vars': 'off',
    'vue/no-unused-refs': 'off',
    'unused-imports/no-unused-vars': ['error', {
      vars: 'all',
      varsIgnorePattern: '^_',
      args: 'after-used',
      argsIgnorePattern: '^_',
      caughtErrors: 'none',
    }],
    'eslint-comments/no-unlimited-disable': 'off',
    'jsdoc/check-param-names': 'off',
    'jsdoc/require-returns-description': 'off',
    'ts/no-empty-object-type': 'off',
    'no-extend-native': 'off',
    'e18e/prefer-object-has-own': 'off',
    'pnpm/yaml-enforce-settings': 'off',
    'pnpm/enforce-settings': 'off',
    'perfectionist/sort-imports': 'off',

    // IDE 实时红线报错规则 1: 页面严禁直接 import raw schema.d.ts
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['**/service/contract/schema', '@/service/contract/schema'],
            message: '严禁在 pages / subPages 中直接 import raw schema.d.ts！请通过业务域 View Model 引入。',
          },
        ],
      },
    ],

    // IDE 实时红线报错规则 2: 架构边界守卫 (eslint-plugin-boundaries)
    'boundaries/dependencies': [
      'error',
      {
        default: 'allow',
        policies: [
          {
            from: [{ element: { type: 'pages' } }, { element: { type: 'subPages' } }, { element: { type: 'app' } }],
            disallow: [{ element: { type: 'contract' } }],
            message: '编排层（pages / subPages / app）严禁跨过 features 直接依赖底层 contract 原始定义。',
          },
          {
            from: [{ element: { type: 'features' } }],
            disallow: [{ element: { type: 'pages' } }, { element: { type: 'subPages' } }, { element: { type: 'app' } }],
            message: '业务域模块严禁反向依赖编排层（pages / subPages / app）。',
          },
          {
            from: [{ element: { type: 'features' } }],
            disallow: [{ element: { type: 'features', domain: '!{{from.element.domain}}' } }],
            message: '业务域之间禁止互相依赖，请把公共部分下沉到 service 或 shared。',
          },
          {
            from: [{ element: { type: 'shared' } }],
            disallow: [{ element: { type: 'features' } }],
            message: '基础公共层（components / composables / utils / constants / styles / router / store）严禁反向依赖业务域 features。应用外壳请放 src/app。',
          },
        ],
      },
    ],

    'vue/singleline-html-element-content-newline': [
      'error',
      {
        externalIgnores: ['text'],
      },
    ],
    'vue/block-order': ['error', {
      order: ['script', 'template', 'style'],
    }],
  },
  // css / scss / html / json / md 统一交给 oxfmt（见 package.json 的 fmt 脚本）。
  // 这里若也开 formatters，eslint 内嵌 prettier(printWidth 120) 会和
  // oxfmt(printWidth 100) 对同一批文件给出互相矛盾的结论，来回拉锯。
  formatters: false,
})
