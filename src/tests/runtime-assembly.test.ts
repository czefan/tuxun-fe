import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import PhotoWaterfall from '@/features/photo/components/photo-waterfall.vue'
import { useViewTransition } from '@/composables/use-view-transition'
import { mockStubPlugin } from '../../build/plugins/mock-stub'

function read(relative: string) {
  return fs.readFileSync(path.join(process.cwd(), relative), 'utf-8')
}

function makeList(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    title: `题目 ${i + 1}`,
    image: { url: `https://example.com/${i + 1}.jpg`, originUrl: `https://example.com/${i + 1}.jpg`, width: 800, height: 600 },
    cover: `https://example.com/${i + 1}.jpg`,
    author: { id: 1, nickname: 'tester', avatar: '' },
    liked: false,
    solved: false,
    likesCount: 0,
    createdAt: '2026-07-31T00:00:00Z',
  }))
}

/**
 * 装配守卫。
 *
 * 这些用例刻意都是「行为」或「源码事实」断言，不写
 * `expect(typeof useX).toBe('function')` 这类同义反复——那种断言只要文件还在
 * 就永远绿，装配断掉一样发现不了，而它本来就被 type-check 覆盖了。
 */
describe('装配守卫', () => {
  it('瀑布流必须渐进渲染完所有数据，不能停在第一批', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      const wrapper = mount(PhotoWaterfall, {
        props: { list: makeList(45) },
        global: { plugins: [VueQueryPlugin] },
      })

      expect(wrapper.findAllComponents({ name: 'photo-card' }).length).toBeLessThanOrEqual(20)

      // 分批调度靠链式 setTimeout(16)，推进 200ms 即可渲染完所有批次
      await vi.advanceTimersByTimeAsync(200)
      await wrapper.vm.$nextTick()

      const rendered = wrapper.findAll('.photo-card')
      expect(
        rendered.length,
        `瀑布流只渲染了 ${rendered.length}/45 条：分批推进逻辑断了，超出首批的数据用户永远看不到`,
      ).toBe(45)
    }
    finally {
      vi.useRealTimers()
    }
  })

  it('上拉加载追加数据时不能塌回第一批', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      const wrapper = mount(PhotoWaterfall, {
        props: { list: makeList(25) },
        global: { plugins: [VueQueryPlugin] },
      })
      await vi.advanceTimersByTimeAsync(200)
      await wrapper.vm.$nextTick()
      expect(wrapper.findAll('.photo-card').length).toBe(25)

      // 第二页追加：已渲染的 25 条必须留在原地，不能先塌回 20 再长回来
      await wrapper.setProps({ list: makeList(45) })
      await wrapper.vm.$nextTick()
      expect(
        wrapper.findAll('.photo-card').length,
        '追加数据后已渲染内容被重置了，用户会看到列表先缩短再重新长出来',
      ).toBeGreaterThanOrEqual(25)

      await vi.advanceTimersByTimeAsync(200)
      await wrapper.vm.$nextTick()
      expect(wrapper.findAll('.photo-card').length).toBe(45)
    }
    finally {
      vi.useRealTimers()
    }
  })

  it('startTransition 必须等待回调完成（否则转场截到的是同一帧）', async () => {
    const { startTransition } = useViewTransition()
    const order: string[] = []

    await startTransition(async () => {
      await new Promise(resolve => setTimeout(resolve, 10))
      order.push('callback-done')
    })
    order.push('transition-returned')

    expect(order).toEqual(['callback-done', 'transition-returned'])
  })

  it('navigateWithTransition 必须真的发起跳转', async () => {
    const { navigateWithTransition } = useViewTransition()
    const navigateTo = uni.navigateTo as unknown as ReturnType<typeof vi.fn>
    navigateTo.mockImplementation((options: any) => options.success?.())

    await navigateWithTransition('/subPages/question/detail?id=7')

    expect(navigateTo).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/subPages/question/detail?id=7' }),
    )
  })

  it('关闭 mock 时构建插件必须把 mock 入口换成空实现', () => {
    const [plugin] = mockStubPlugin(false)
    const load = plugin.load as (id: string) => string | null

    const stubbed = load(path.join(process.cwd(), 'src/mocks/index.ts'))
    expect(
      stubbed,
      'mock 入口没有被替换：msw 会整条进生产模块图（实测多打约 296 KB）',
    ).toContain('enableMocking')
    expect(stubbed).not.toContain('./browser')

    expect(load(path.join(process.cwd(), 'src/main.ts'))).toBeNull()

    // 开启 mock 时不替换入口，改为负责把 Service Worker 挂到站点根路径：
    // uni 强制 publicDir='__static__'，public/ 不会进产物，缺了它请求会全部透传
    const [mockPlugin] = mockStubPlugin(true)
    expect(mockPlugin.load).toBeUndefined()
    expect(mockPlugin.generateBundle, 'mock 构建没有产出 mockServiceWorker.js').toBeDefined()
  })

  it('详情页必须挂上评论区，个人中心必须走 useUserInfo', () => {
    const detail = read('src/subPages/question/detail.vue')
    expect(detail, '详情页没有渲染 CommentList：评论区代码写了但没人用').toContain('<CommentList')

    const my = read('src/pages/my/index.vue')
    expect(my, '个人中心没接 useUserInfo').toContain('useUserInfo(')
    expect(
      my,
      '个人中心的 useUserInfo 缺少 enabled 守卫：未登录进页面会打一发注定 401 的请求',
    ).toMatch(/useUserInfo\(\{[^}]*enabled:/)
  })

  it('所有域的 queryKey 都不得用 .value 取成静态快照', () => {
    const dir = path.join(process.cwd(), 'src/features')
    const files: string[] = []
    for (const domain of fs.readdirSync(dir)) {
      const file = path.join(dir, domain, 'query.ts')
      if (fs.existsSync(file)) {
        files.push(file)
      }
    }
    expect(files.length).toBeGreaterThan(0)

    for (const file of files) {
      const source = fs.readFileSync(file, 'utf-8')
      expect(
        source,
        `${path.relative(process.cwd(), file)} 里 queryKey 用 computed(...).value 取值，`
        + '会在 setup 时冻成静态快照——参数变了不会重新请求，筛选/排序/搜索全部失效',
      ).not.toMatch(/queryKey:\s*computed\([\s\S]*?\)\)\.value/)
    }
  })

  it('声明了搜索状态的页面必须真的渲染搜索浮层', () => {
    // 首页曾经出现过：script 里 goSearch / handleSearch / searchKeyword 一整套都写好了，
    // 模板里却没放 <search-overlay>，点搜索按钮毫无反应，而 lint 和构建都不会报错。
    const pages = ['src/pages/index/index.vue', 'src/pages/activity/index.vue', 'src/subPages/activity/index.vue']
    for (const page of pages) {
      const source = read(page)
      if (!source.includes('searchVisible')) {
        continue
      }
      expect(
        source,
        `${page} 声明了 searchVisible 却没有渲染 <search-overlay>：搜索入口点了没反应`,
      ).toMatch(/<search-overlay/)
    }
  })

  it('跳转详情页必须走带转场的导航', () => {
    for (const page of ['src/pages/index/index.vue', 'src/subPages/activity/index.vue']) {
      expect(
        read(page),
        `${page} 没有使用 navigateWithTransition：转场工具做了但没接上`,
      ).toContain('navigateWithTransition(')
    }
  })

  it('题目详情页必须接上全屏大图预览', () => {
    const detail = read('src/subPages/question/detail.vue')
    expect(detail, '题目详情页没有引入 previewImage：全屏大图预览功能漏接').toContain('previewImage')
    // 不锁死事件名：主图从原生 <image> 换成 wd-img 后要绑 @click
    // （wd-img 只 emit error / click / load，不 emit tap）。
    // 这里要守的是「预览接上了没」，不是用哪个事件。
    expect(
      /@(?:tap|click)="handlePreviewImage"/.test(detail),
      '题目详情页图片缺少预览事件绑定',
    ).toBe(true)
  })
})
