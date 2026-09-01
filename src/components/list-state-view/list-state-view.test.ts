import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ListStateView from './list-state-view.vue'

describe('list-state-view 组件与状态优先级守卫', () => {
  it('未登录优先级最高：needsLogin 与 loading、error、empty 同时为真时只渲染登录引导', async () => {
    const wrapper = mount(ListStateView, {
      props: {
        needsLogin: true,
        loading: true,
        error: true,
        empty: true,
        loginTip: '登录后查看作答记录',
      },
      slots: {
        default: '<div class="default-content">列表内容</div>',
      },
    })

    // 只渲染登录引导
    expect(wrapper.html()).toContain('tip="登录后查看作答记录"')
    expect(wrapper.find('wd-button').exists() || wrapper.find('wd-button-stub').exists()).toBe(true)
    expect(wrapper.find('.default-content').exists()).toBe(false)
    expect(wrapper.find('wd-loading').exists() || wrapper.find('wd-loading-stub').exists()).toBe(
      false,
    )
    expect(wrapper.html()).not.toContain('network-error')

    // 验证自定义 #login 插槽
    const customWrapper = mount(ListStateView, {
      props: { needsLogin: true },
      slots: {
        login: '<div class="custom-login">自定义登录弹层</div>',
      },
    })
    expect(customWrapper.find('.custom-login').exists()).toBe(true)
    expect(customWrapper.text()).toContain('自定义登录弹层')
  })

  it('loading 优先于 error 与 empty', () => {
    const wrapper = mount(ListStateView, {
      props: {
        needsLogin: false,
        loading: true,
        error: true,
        empty: true,
        errorTip: '网络错误',
        emptyTip: '没有数据',
      },
      slots: {
        default: '<div class="default-content">列表内容</div>',
      },
    })

    const hasLoading =
      wrapper.find('wd-loading').exists() || wrapper.find('wd-loading-stub').exists()
    expect(hasLoading).toBe(true)
    expect(wrapper.html()).not.toContain('网络错误')
    expect(wrapper.html()).not.toContain('没有数据')
    expect(wrapper.find('.default-content').exists()).toBe(false)
  })

  it('四态全 false 时渲染默认插槽', () => {
    const wrapper = mount(ListStateView, {
      props: {
        needsLogin: false,
        loading: false,
        error: false,
        empty: false,
      },
      slots: {
        default: '<div class="list-item">真实列表条目</div>',
      },
    })

    expect(wrapper.find('.list-item').exists()).toBe(true)
    expect(wrapper.text()).toContain('真实列表条目')
    expect(wrapper.find('wd-loading').exists() || wrapper.find('wd-loading-stub').exists()).toBe(
      false,
    )
    expect(wrapper.find('wd-empty').exists() || wrapper.find('wd-empty-stub').exists()).toBe(false)
  })

  it('loadingVariant=skeleton 时渲染 #loading 插槽而非 wd-loading', () => {
    const wrapper = mount(ListStateView, {
      props: {
        loading: true,
        loadingVariant: 'skeleton',
      },
      slots: {
        loading: '<div class="skeleton-box">骨架屏骨架</div>',
        default: '<div class="default-content">列表内容</div>',
      },
    })

    expect(wrapper.find('.skeleton-box').exists()).toBe(true)
    expect(wrapper.text()).toContain('骨架屏骨架')
    expect(wrapper.find('wd-loading').exists() || wrapper.find('wd-loading-stub').exists()).toBe(
      false,
    )
    expect(wrapper.find('.default-content').exists()).toBe(false)
  })

  it('支持默认与自定义 #empty 插槽渲染', () => {
    const defaultWrapper = mount(ListStateView, {
      props: { empty: true, emptyTip: '暂无任何数据' },
    })
    expect(defaultWrapper.html()).toContain('tip="暂无任何数据"')

    const customWrapper = mount(ListStateView, {
      props: { empty: true },
      slots: { empty: '<div class="custom-empty">自定义空列表</div>' },
    })
    expect(customWrapper.find('.custom-empty').exists()).toBe(true)
    expect(customWrapper.text()).toContain('自定义空列表')
  })

  it('支持默认与自定义 #error 插槽渲染', () => {
    const defaultWrapper = mount(ListStateView, {
      props: { error: true, errorTip: '网络请求异常' },
    })
    expect(defaultWrapper.html()).toContain('tip="网络请求异常"')

    const customWrapper = mount(ListStateView, {
      props: { error: true },
      slots: { error: '<div class="custom-error">自定义错误组件</div>' },
    })
    expect(customWrapper.find('.custom-error').exists()).toBe(true)
    expect(customWrapper.text()).toContain('自定义错误组件')
  })
})
