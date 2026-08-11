import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { toImageVM } from '@/service/contract/types'

const PROJECT_ROOT = process.cwd()
const SPEC_PATH = path.resolve(PROJECT_ROOT, 'contract/apifox-import.json')
const SRC_ROOT = path.join(PROJECT_ROOT, 'src')

function readSpec() {
  return JSON.parse(fs.readFileSync(SPEC_PATH, 'utf-8'))
}

/** 递归收集 src 下的 .ts / .vue，排除生成物 */
function collectSourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      collectSourceFiles(full, acc)
    }
    else if ((full.endsWith('.ts') || full.endsWith('.vue')) && !full.endsWith('schema.d.ts')) {
      acc.push(full)
    }
  }
  return acc
}

/** 匹配组件块：同时覆盖自闭合与配对写法，以及 kebab-case / PascalCase 两种命名 */
function matchComponentBlocks(content: string, names: string[]): string[] {
  const namePattern = names.join('|')
  const pattern = new RegExp(`<(?:${namePattern})\\b[\\s\\S]*?(?:/>|<(?:${namePattern})>)`, 'g')
  return content.match(pattern) ?? []
}

/** 判定源码是否发起写操作：hook 名含动作动词（不限位置）或调用 .mutate / .mutateAsync */
function hasWriteOp(content: string): boolean {
  // 注意动词段必须独立成驼峰段：`use` 后的 `[A-Z]` 只属于第一个词，
  // 动词可以出现在 hook 名任意位置（useSubmitAttempt / usePostComment / useSetCommentLike…）。
  // 不能用 `\buse[A-Z]\w*(?:Submit)\w*\b` —— 它会把 Submit 的首字母吃进 [A-Z]，
  // 剩下 `ubmitAttempt` 里没有动词，useSubmitAttempt 照样漏检（曾真实漏过 submit.vue）。
  // 头尾段都用 (?:[A-Z][a-z]+)*：每次迭代至少消费 2 字符，无零宽自循环，规避
  // regexp/no-super-linear-backtracking 的指数回退告警。
  return /\buse(?:[A-Z][a-z]+)*(?:Mutation|Like|Post|Delete|Submit|Update|Exchange|Create|Remove)(?:[A-Z][a-z]+)*\b/.test(content)
    || /\.mutate(?:Async)?\(/.test(content)
}

describe('契约变更负向守卫', () => {
  it('宽高防御：toImageVM 遇到 0 / 负数 / 缺失时降级到 4:3，绝不产出 NaN 或 Infinity', () => {
    expect(toImageVM({ thumb_url: 'http://a.com/1.jpg', width: 0, height: 100 }))
      .toEqual({ url: 'http://a.com/1.jpg', originUrl: 'http://a.com/1.jpg', width: 800, height: 600 })
    expect(toImageVM({ origin_url: 'http://a.com/2.jpg', width: -100, height: -200 }))
      .toEqual({ url: 'http://a.com/2.jpg', originUrl: 'http://a.com/2.jpg', width: 800, height: 600 })
    expect(toImageVM(null)).toEqual({ url: '', originUrl: '', width: 800, height: 600 })

    // 互为兜底测试：只有 origin_url 时 url 退化为 origin_url，只有 thumb_url 时 originUrl 退化为 thumb_url
    expect(toImageVM({ origin_url: 'http://a.com/origin.jpg', width: 800, height: 600 }))
      .toEqual({ url: 'http://a.com/origin.jpg', originUrl: 'http://a.com/origin.jpg', width: 800, height: 600 })
    expect(toImageVM({ thumb_url: 'http://a.com/thumb.jpg', width: 800, height: 600 }))
      .toEqual({ url: 'http://a.com/thumb.jpg', originUrl: 'http://a.com/thumb.jpg', width: 800, height: 600 })

    // 真正要防的是下游除零：任何输入都必须能算出有限的宽高比
    for (const input of [
      { thumb_url: 'u', width: 0, height: 0 },
      { origin_url: 'u', width: Number.NaN, height: 10 },
      { thumb_url: 'u' } as never,
    ]) {
      const vm = toImageVM(input)
      expect(Number.isFinite(vm.height / vm.width)).toBe(true)
    }
  })

  it('_url 残根：除 contract 生成物外，源码不得再出现旧命名（mock 层同样受管）', () => {
    // 旧字段名一旦漏改，ajv 契约守卫只在 mock 走到那条路由时才报；
    // 这条是全量静态兜底，所以**不能**把 src/mocks 排除在外——
    // mock 数据恰恰是漏改率最高的地方。
    const forbidden = ['thumb_image', 'origin_image', 'image_url', 'cover_url', 'avatar_url', 'guess_image_url']
    const violations: string[] = []

    for (const file of collectSourceFiles(SRC_ROOT)) {
      // 本文件自身要写出这些字符串才能检查，跳过
      if (file.endsWith('negative-guards.test.ts')) {
        continue
      }
      const content = fs.readFileSync(file, 'utf-8')
      for (const key of forbidden) {
        if (content.includes(key)) {
          violations.push(`${path.relative(PROJECT_ROOT, file)} 残留旧字段 ${key}`)
        }
      }
    }

    expect(violations, `发现旧字段残根：\n${violations.join('\n')}`).toEqual([])
  })

  it('服务器时间：活动状态推导不得直接读本地 Date.now()', () => {
    const content = fs.readFileSync(
      path.join(PROJECT_ROOT, 'src/features/activity/derive-status.ts'),
      'utf-8',
    )
    expect(content.includes('Date.now()'), 'derive-status.ts 直接调用了 Date.now()，改本地时间就能伪造活动状态').toBe(false)
    expect(content.includes('serverNow()'), 'derive-status.ts 必须走 serverNow()').toBe(true)
  })

  it('新字段接线：新增字段必须真的被页面消费，而不是只映射到 VM 就算完', () => {
    const cases: Array<{ file: string, needles: string[], why: string }> = [
      { file: 'src/pages/notice/index.vue', needles: ['photoId'], why: '互动消息要能跳到关联题目' },
      { file: 'src/subPages/my/points.vue', needles: ['relatedTitle'], why: '积分明细要显示关联标题，否则 related_title 白加' },
      { file: 'src/subPages/mall/index.vue', needles: ['verifyCode'], why: '兑换记录要出核销码' },
      { file: 'src/subPages/mall/index.vue', needles: ['originUrl'], why: '契约把高清图放进列表就是为了免详情请求，不消费等于白给' },
      { file: 'src/features/photo/components/photo-card.vue', needles: ['solved'], why: '题目卡片要显示已破解角标' },
      { file: 'src/subPages/notice/detail.vue', needles: ['originUrl'], why: '通知配图映射了就必须渲染' },
      { file: 'src/features/attempt/components/my-attempt-list.vue', needles: ['originUrl'], why: '作答记录要能看高清原图' },
      { file: 'src/pages/index/index.vue', needles: ['solved'], why: '首页要有「只看未破解」筛选' },
    ]

    const missing = cases
      .filter(({ file, needles }) => {
        const content = fs.readFileSync(path.join(PROJECT_ROOT, file), 'utf-8')
        return !needles.every(n => content.includes(n))
      })
      .map(({ file, needles, why }) => `${file} 未接入 ${needles.join('/')}（${why}）`)

    expect(missing, `以下新字段只映射了没接上：\n${missing.join('\n')}`).toEqual([])
  })

  it('查询参数对账：各域 QueryParams 声明的字段必须真的存在于契约 parameters 中', () => {
    const spec = readSpec()

    /** 从 `export interface XxxQueryParams ... {}` 里抠出字段名（忽略继承来的分页字段） */
    function extractFields(file: string, interfaceName: string): string[] {
      const content = fs.readFileSync(path.join(PROJECT_ROOT, file), 'utf-8')
      const match = content.match(new RegExp(`interface\\s+${interfaceName}[^{]*\\{([\\s\\S]*?)\\n\\}`))
      expect(match, `${file} 中找不到 ${interfaceName}`).toBeTruthy()
      return [...match![1].matchAll(/^\s*(\w+)\??\s*:/gm)].map(m => m[1])
    }

    function specParams(pathKey: string, method: string): string[] {
      const op = spec.paths?.[pathKey]?.[method]
      expect(op, `契约中不存在 ${method.toUpperCase()} ${pathKey}`).toBeTruthy()
      return (op.parameters || []).map((p: { name: string }) => p.name)
    }

    const targets = [
      { file: 'src/features/photo/types.ts', name: 'PhotoQueryParams', path: '/photos', method: 'get' },
      { file: 'src/features/activity/types.ts', name: 'ActivityQueryParams', path: '/activity', method: 'get' },
      { file: 'src/features/mall/types.ts', name: 'GoodsQueryParams', path: '/goods', method: 'get' },
      { file: 'src/features/record/types.ts', name: 'UserPhotoQueryParams', path: '/photos/user', method: 'get' },
      { file: 'src/features/record/types.ts', name: 'UserAttemptQueryParams', path: '/attempts/user', method: 'get' },
      { file: 'src/features/notification/types.ts', name: 'AnnouncementQueryParams', path: '/announcements', method: 'get' },
    ]

    const violations: string[] = []
    for (const t of targets) {
      const allowed = new Set([...specParams(t.path, t.method), 'page', 'page_size'])
      for (const field of extractFields(t.file, t.name)) {
        if (!allowed.has(field)) {
          violations.push(`${t.name}.${field} 在契约 ${t.method.toUpperCase()} ${t.path} 的 parameters 中不存在`)
        }
      }
    }

    expect(violations, `前端声明了后端不认的查询参数：\n${violations.join('\n')}`).toEqual([])
  })

  it('分页钳制守卫：各业务域 api.ts 中所有带 page 参数的分页接口必须统一使用 clampPageParams 钳制，禁止裸传 params?.page', () => {
    const apiFiles = [
      'src/features/activity/api.ts',
      'src/features/attempt/api.ts',
      'src/features/comment/api.ts',
      'src/features/mall/api.ts',
      'src/features/notification/api.ts',
      'src/features/photo/api.ts',
      'src/features/record/api.ts',
      'src/features/score/api.ts',
    ]

    const violations: string[] = []
    for (const relPath of apiFiles) {
      const fullPath = path.join(PROJECT_ROOT, relPath)
      const content = fs.readFileSync(fullPath, 'utf-8')
      if (content.includes('page: params?.page')) {
        violations.push(`${relPath} 裸传了 params?.page，未走 clampPageParams 钳制（会导致后端报 参数错误: Page最小只能为一）`)
      }
    }

    expect(violations, `发现未钳制的分页请求接口：\n${violations.join('\n')}`).toEqual([])
  })

  it('查询参数对账：sort_by 的枚举值必须与契约一字不差', () => {
    const spec = readSpec()
    const sortParam = spec.paths['/photos'].get.parameters.find((p: { name: string }) => p.name === 'sort_by')
    const specEnum: string[] = sortParam.schema.enum

    const content = fs.readFileSync(path.join(PROJECT_ROOT, 'src/features/photo/types.ts'), 'utf-8')
    const line = content.match(/sort_by\?:\s*([^\n]+)/)?.[1] ?? ''
    const declared = [...line.matchAll(/'([^']+)'/g)].map(m => m[1])

    expect(declared.slice().sort(), `PhotoQueryParams.sort_by 与契约枚举不一致（契约：${specEnum.join(' / ')}）`)
      .toEqual(specEnum.slice().sort())
  })

  it('vm 字段收敛：VM 接口中不得同时存在 xxxImage 和对应的冗余 xxxUrl / cover 属性，也不得残留旧的 thumbImage / originImage', () => {
    const typeFiles = [
      'src/features/activity/types.ts',
      'src/features/photo/types.ts',
      'src/features/attempt/types.ts',
      'src/features/record/types.ts',
      'src/features/notification/types.ts',
      'src/features/mall/types.ts',
    ]

    const forbiddenPairPatterns = ['coverUrl:', 'imageUrl:', 'thumbUrl:', 'cover:', 'thumbImage', 'originImage']
    const violations: string[] = []

    for (const relPath of typeFiles) {
      const fullPath = path.join(PROJECT_ROOT, relPath)
      const content = fs.readFileSync(fullPath, 'utf-8')
      for (const pattern of forbiddenPairPatterns) {
        if (content.includes(pattern)) {
          violations.push(`${relPath} 仍然包含废弃或冗余声明: ${pattern}`)
        }
      }
    }

    expect(violations, `发现 VM 中残留废弃或冗余属性：\n${violations.join('\n')}`).toEqual([])
  })

  it('遮罩规范：页面与组件模板中不得再出现手写的 fixed inset-0 全屏遮罩，必须统一走 wd-popup', () => {
    const violations: string[] = []
    for (const file of collectSourceFiles(SRC_ROOT)) {
      if (file.endsWith('negative-guards.test.ts')) {
        continue
      }
      const content = fs.readFileSync(file, 'utf-8')
      if (content.includes('fixed inset-0')) {
        violations.push(`${path.relative(PROJECT_ROOT, file)} 仍包含手写全屏遮罩 fixed inset-0`)
      }
    }
    expect(violations, `发现手写全屏遮罩，必须统一替换为 wd-popup：\n${violations.join('\n')}`).toEqual([])
  })

  it('凡是发起写操作（mutation）的组件，都必须接入 requireLogin() 拦截', () => {
    // 豁免清单：仅在已登录状态下访问的整页视图（如个人中心、通知中心）
    const allowlist = new Set([
      'src/pages/my/index.vue',
      'src/pages/notice/index.vue',
    ])

    const offenders = collectSourceFiles(SRC_ROOT)
      .filter(f => f.endsWith('.vue'))
      .filter(f => !allowlist.has(path.relative(PROJECT_ROOT, f)))
      .filter(f => hasWriteOp(fs.readFileSync(f, 'utf-8')))
      .filter(f => !/requireLogin\s*\(/.test(fs.readFileSync(f, 'utf-8')))

    expect(offenders, `以下组件发起写操作但没有 requireLogin() 拦截：\n${offenders.map(f => path.relative(PROJECT_ROOT, f)).join('\n')}`).toEqual([])
  })

  it('写操作检测器：必须能抓到 mutateAsync 与动词不在结尾的 hook（useSubmitAttempt 等）', () => {
    // 检测器自身的行为锁死：正则盲区会导致 submit.vue 这类「动词中间名 + mutateAsync」
    // 的写操作文件漏检，而漏检恰恰是上一轮守卫给出假绿灯的成因。
    const writeSamples = [
      'const submitMutation = useSubmitAttempt(() => photoId.value)',
      'await submitMutation.mutateAsync({ photoId })',
      'const postMutation = usePostComment(() => props.photoId)',
      'useSetCommentLike', // 动词 Like 在中间，后面还跟 Comment
    ]
    for (const sample of writeSamples) {
      expect(hasWriteOp(sample), `检测器漏检写操作样本：${sample}`).toBe(true)
    }

    const readSamples = [
      'usePhotoDetail(id)',
      'useInfiniteCommentList(id)',
      'const list = computed(() => data.value?.pages.flatMap(page => page.list) ?? [])',
    ]
    for (const sample of readSamples) {
      expect(hasWriteOp(sample), `检测器误报读操作样本：${sample}`).toBe(false)
    }
  })

  it('所有 %key% 引用必须在两份 locale 中都存在，且两份键集一致', () => {
    const zhPath = path.join(SRC_ROOT, 'locale/zh-Hans.json')
    const enPath = path.join(SRC_ROOT, 'locale/en.json')
    const zhJson = JSON.parse(fs.readFileSync(zhPath, 'utf-8'))
    const enJson = JSON.parse(fs.readFileSync(enPath, 'utf-8'))

    const zhKeys = Object.keys(zhJson)
    const enKeys = Object.keys(enJson)

    expect(zhKeys.sort()).toEqual(enKeys.sort())

    const keyPattern = /%([\w.-]+)%/g
    const missingKeys: string[] = []

    for (const file of collectSourceFiles(SRC_ROOT)) {
      if (file.endsWith('negative-guards.test.ts')) {
        continue
      }
      const content = fs.readFileSync(file, 'utf-8')
      let match: RegExpExecArray | null
      // eslint-disable-next-line no-cond-assign
      while ((match = keyPattern.exec(content)) !== null) {
        const key = match[1]
        if (!zhJson[key]) {
          missingKeys.push(`${path.relative(PROJECT_ROOT, file)} 使用了未定义的 locale 键: ${key}`)
        }
      }
    }

    expect(missingKeys).toEqual([])
  })

  it('页内列表分页：不能只靠 wd-loadmore 的 reload 翻页（它只在 error 态才响应点击）', () => {
    // wd-loadmore 的 reload() 第一行是 `if (props.state !== 'error') return`，
    // 而这些列表的 state 只会是 loading / undefined / finished，永远点不出下一页。
    // 页内列表滚动的是外层页面，onReachBottom 也用不上，所以必须有显式的加载按钮。
    const inPageLists = [
      'src/features/attempt/components/solve-list.vue',
      'src/features/attempt/components/my-attempt-list.vue',
      'src/features/comment/components/comment-list.vue',
    ]
    const missing = inPageLists.filter((rel) => {
      const content = fs.readFileSync(path.join(PROJECT_ROOT, rel), 'utf-8')
      return !content.includes('加载更多')
    })
    expect(missing, `以下页内列表没有可点击的加载更多入口，实际翻不了页：\n${missing.join('\n')}`).toEqual([])
  })

  it('组件库收敛：瀑布流卡片必须使用 wd-img 提供 loading/error 占位与图片模式封装', () => {
    const cardContent = fs.readFileSync(path.join(PROJECT_ROOT, 'src/features/photo/components/photo-card.vue'), 'utf-8')
    expect(cardContent.includes('<wd-img'), 'photo-card.vue 必须使用 wd-img 组件').toBe(true)
  })

  it('列表图片必须懒加载：wd-img 的 lazyLoad 默认 false，换组件时最容易悄悄丢掉', () => {
    // 原生 <image lazy-load> 换成 <wd-img> 后不显式传 lazy-load，
    // 长列表会一次性发起全部图片请求——正是之前「浏览器很卡」的成因之一。
    // 逐个 <wd-img> 检查，不能只看文件里有没有出现过 lazy-load：
    // 一个文件里有多个 wd-img 时，漏掉其中一个照样匹配得到。
    const violations: string[] = []
    for (const file of collectSourceFiles(SRC_ROOT)) {
      if (file.endsWith('negative-guards.test.ts')) {
        continue
      }
      const content = fs.readFileSync(file, 'utf-8')
      const blocks = matchComponentBlocks(content, ['wd-img', 'WdImg'])
      blocks.forEach((block, i) => {
        if (!block.includes('lazy-load')) {
          violations.push(`${path.relative(PROJECT_ROOT, file)} 第 ${i + 1} 个 wd-img 未开 lazy-load`)
        }
      })
    }
    expect(violations, `以下 wd-img 没开懒加载：\n${violations.join('\n')}`).toEqual([])
  })

  it('wd-img 的点击必须绑 @click：它只声明了 error / click / load，没有 tap', () => {
    // `@tap` 不在 wd-img 的 emits 里，只能靠属性透传落到根 <view> 上碰运气；
    // 组件哪天改成 inheritAttrs: false 或根节点换了，大图预览就静默失效。
    // 根节点本来就是 `<view @click="handleClick">` 并显式 emit('click')，直接绑 @click。
    const violations: string[] = []
    for (const file of collectSourceFiles(SRC_ROOT)) {
      if (file.endsWith('negative-guards.test.ts')) {
        continue
      }
      const blocks = matchComponentBlocks(fs.readFileSync(file, 'utf-8'), ['wd-img', 'WdImg'])
      blocks.forEach((block, i) => {
        if (block.includes('@tap=')) {
          violations.push(`${path.relative(PROJECT_ROOT, file)} 第 ${i + 1} 个 wd-img 用了 @tap，应改为 @click`)
        }
      })
    }
    expect(violations, `wd-img 不 emit tap：\n${violations.join('\n')}`).toEqual([])
  })

  it('like-button 的点击必须只绑 @click：组件内部已 emit click，父级再绑 @tap 会透传到根节点重复触发', () => {
    // like-button 根节点自带 @tap.stop/@click.stop，且只在 handleTap 里 emit('click')。
    // 父级再写 @tap.stop="handleToggleLike" 会作为 attrs 透传到根节点，与 @click 各触发一次，
    // 导致点赞被调用两次（未登录时 requireLogin 弹两次确认框）。
    const violations: string[] = []
    for (const file of collectSourceFiles(SRC_ROOT)) {
      if (file.endsWith('negative-guards.test.ts')) {
        continue
      }
      const blocks = matchComponentBlocks(fs.readFileSync(file, 'utf-8'), ['like-button', 'LikeButton'])
      blocks.forEach((block, i) => {
        if (/@tap[.=]/.test(block)) {
          violations.push(`${path.relative(PROJECT_ROOT, file)} 第 ${i + 1} 个 like-button 绑了 @tap，应只用 @click`)
        }
      })
    }
    expect(violations, `like-button 被 @tap 重复绑定，点击会触发两次：\n${violations.join('\n')}`).toEqual([])
  })

  it('组件库收敛：列表/页面不能手写裸 <text>加载中...字符串', () => {
    const violations: string[] = []
    for (const file of collectSourceFiles(SRC_ROOT)) {
      if (!file.endsWith('.vue') || file.endsWith('negative-guards.test.ts')) {
        continue
      }
      const content = fs.readFileSync(file, 'utf-8')
      const template = content.match(/<template\b[\s\S]*?<\/template>/)?.[0] ?? ''
      if (template.includes('>加载中...<') || template.includes('>正在加载...<')) {
        violations.push(path.relative(PROJECT_ROOT, file))
      }
    }
    expect(violations, `以下 Vue 模板包含手写加载文本（应换成 wd-skeleton / wd-loading / wd-loadmore）：\n${violations.join('\n')}`).toEqual([])
  })

  it('组件库收敛：瀑布流与列表空态必须统一使用 wd-empty', () => {
    const cardContent = fs.readFileSync(path.join(PROJECT_ROOT, 'src/features/photo/components/photo-waterfall.vue'), 'utf-8')
    expect(cardContent.includes('<wd-empty'), 'photo-waterfall.vue 必须使用 wd-empty 组件').toBe(true)
    expect(cardContent.includes('photo-waterfall__empty'), 'photo-waterfall.vue 不能保留手写空态类名').toBe(false)
  })

  it('组件库收敛：投稿、意见反馈与提交作答页面必须使用 wd-form 排版', () => {
    // 只要求用 wd-form / wd-form-item 做标签与排版。
    // **不能要求 `:rules`**——这个版本的 wd-form 根本没有该 prop（只有 `schema`），
    // 传了会被当普通属性丢掉、`validate()` 恒返回 valid: true。
    // 实际的必填与坐标校验由 handleSubmit 里的显式判断负责，
    // 由 src/tests/location-guard.test.ts 盯着。
    const formPages = [
      'src/subPages/contribute/index.vue',
      'src/subPages/my/feedback.vue',
      'src/subPages/question/submit.vue',
    ]
    const violations: string[] = []
    for (const page of formPages) {
      const content = fs.readFileSync(path.join(PROJECT_ROOT, page), 'utf-8')
      if (!content.includes('<wd-form')) {
        violations.push(page)
      }
    }
    expect(violations, `以下表单页面未使用 wd-form：\n${violations.join('\n')}`).toEqual([])
  })

  it('跨端安全防护：浏览器专有全局（document/window/navigator/localStorage）必须在 #ifdef H5 内或有 typeof 守卫', () => {
    const browserGlobals = ['document', 'window', 'navigator', 'localStorage']
    const violations: string[] = []

    /**
     * 条件编译指令是否允许浏览器全局对象：
     * 本项目只有 H5 / mp-weixin 两个目标平台，判定只看该条件是否**排除了小程序**：
     * - #ifdef H5               → 仅 H5，安全
     * - #ifdef H5 || MP-WEIXIN  → 含小程序，不安全（document 在 MP 不存在）
     * - #ifndef H5              → 含小程序，不安全
     * - #ifndef MP-WEIXIN       → 排除小程序，安全
     * 用 `startsWith('MP')` 而非精确匹配，可同时覆盖 MP-WEIXIN / MP-BAIDU 等全部小程序平台。
     */
    const isBrowserSafeDirective = (line: string): boolean => {
      const m = line.match(/#(ifdef|ifndef)\s([\w\s|-]+)/)
      if (!m) {
        return false
      }
      const isIfdef = m[1] === 'ifdef'
      const parts = m[2].split('|').map(s => s.trim())
      return isIfdef ? !parts.some(p => p.startsWith('MP')) : parts.some(p => p.startsWith('MP'))
    }

    for (const file of collectSourceFiles(SRC_ROOT)) {
      if (file.endsWith('negative-guards.test.ts')) {
        continue
      }
      const content = fs.readFileSync(file, 'utf-8')
      const lines = content.split('\n')

      // 用条件栈而不是单个 H5 深度计数器：`#ifdef H5` 内再嵌 `#ifdef H5 || MP-WEIXIN`
      // 会把范围重新扩回小程序，计数器会把内层误判为安全（真实漏检路径）。
      // 逐层压栈后取 every()：任何一层条件未排除小程序，该行即不可信。
      const blockStack: boolean[] = []
      lines.forEach((line, index) => {
        const trimmed = line.trim()
        const directiveMatch = trimmed.match(/#(?:ifdef|ifndef)\s([\w\s|-]+)/)
        if (directiveMatch) {
          blockStack.push(isBrowserSafeDirective(trimmed))
          return
        }
        if (trimmed.includes('#endif')) {
          blockStack.pop()
          return
        }

        // 仅当所有外层条件都排除小程序（纯 H5 上下文）时才跳过检查；
        // 空栈（无条件编译）、含 MP 的块、以及 H5 内嵌 MP 的收窄都要继续检查，
        // 否则 document 在 MP 端照样裸奔（曾真实漏检 verify-code-qr.vue）。
        if (blockStack.length > 0 && blockStack.every(Boolean)) {
          return
        }
        if (trimmed.startsWith('//') || trimmed.startsWith('*')) {
          return // 行注释，不参与检查
        }

        // 去除单行尾部注释
        const codeLine = line.replace(/\/\/.*$/, '')

        // 不处于纯 H5 条件块内时，检查是否涉及浏览器全局对象引用
        for (const glob of browserGlobals) {
          // 匹配独立的全局对象调用（如 document.xxx, window.xxx）
          const reg = new RegExp(`\\b${glob}\\.`, 'g')
          if (reg.test(codeLine)) {
            // 运行时环境判断检查：文件内包含 typeof window / typeof document 等守卫，或属于仅开发/Mock环境
            const hasAnyTypeofCheck = /typeof\s+(?:window|document|navigator|localStorage)/.test(content)
            if (!hasAnyTypeofCheck) {
              violations.push(`${path.relative(PROJECT_ROOT, file)}:L${index + 1} 裸引用了浏览器全局变量 ${glob}，在非 H5 平台会抛错误`)
            }
          }
        }
      })
    }

    expect(violations, `发现未作跨端防护的浏览器全局变量引用：\n${violations.join('\n')}`).toEqual([])
  })

  it('环境变量有效性：env 文件夹中定义的环境变量必须在工程中有代码消费者', () => {
    const envDir = path.join(PROJECT_ROOT, 'env')
    const envFiles = fs.readdirSync(envDir).filter(f => f.startsWith('.env'))

    const declaredVars = new Set<string>()
    for (const envFile of envFiles) {
      const content = fs.readFileSync(path.join(envDir, envFile), 'utf-8')
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith('#')) {
          const match = trimmed.match(/^(VITE_[A-Z0-9_]+)\s*=/)
          if (match) {
            declaredVars.add(match[1])
          }
        }
      }
    }

    // 白名单允许的独立配置型 / 全局注入型变量
    const allowlist = new Set([
      'VITE_APP_TITLE',
      'VITE_UNI_APPID',
      'VITE_WX_APPID',
      'VITE_AMAP_KEY',
      'VITE_AMAP_SECURITY_JSCODE',
      'VITE_AMAP_SERVICE_HOST',
      'VITE_SERVER_BASEURL__WEIXIN_DEVELOP',
      'VITE_SERVER_BASEURL__WEIXIN_TRIAL',
      'VITE_SERVER_BASEURL__WEIXIN_RELEASE',
      // 注意：VITE_SHOW_SOURCEMAP 已接上 vite.config.ts 的 build.sourcemap；
      // VITE_COPY_NATIVE_RES_ENABLE 已删除（本项目无 App 端构建）。若再出现僵尸变量，
      // 先接上消费者或从 env 文件删除，不要直接加进白名单。
    ])

    const searchTargets: string[] = []
    function collectAllSearchFiles(dir: string) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
            collectAllSearchFiles(full)
          }
        }
        else if (/\.(?:ts|js|vue|mjs|cjs|json)$/.test(entry.name) && !entry.name.endsWith('apifox-import.json')) {
          searchTargets.push(full)
        }
      }
    }

    collectAllSearchFiles(SRC_ROOT)
    collectAllSearchFiles(path.join(PROJECT_ROOT, 'build'))
    collectAllSearchFiles(path.join(PROJECT_ROOT, 'scripts'))
    searchTargets.push(path.join(PROJECT_ROOT, 'vite.config.ts'))
    searchTargets.push(path.join(PROJECT_ROOT, 'manifest.config.ts'))
    searchTargets.push(path.join(PROJECT_ROOT, 'index.html'))

    const violations: string[] = []
    for (const varName of declaredVars) {
      if (allowlist.has(varName)) {
        continue
      }

      let used = false
      for (const target of searchTargets) {
        if (target.endsWith('negative-guards.test.ts')) {
          continue
        }
        const text = fs.readFileSync(target, 'utf-8')
        if (text.includes(varName)) {
          used = true
          break
        }
      }

      if (!used) {
        violations.push(`环境变量 ${varName} 在 env 文件中有定义，但在工程中零消费`)
      }
    }

    expect(violations, `发现定义的僵尸环境变量：\n${violations.join('\n')}`).toEqual([])
  })
})
