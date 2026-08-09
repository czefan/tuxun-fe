import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import StatusTag from './status-tag.vue'

describe('statusTag', () => {
  it('status="pending" 不包含文字，采用图标渲染', () => {
    const wrapper = mount(StatusTag, {
      props: { status: 'pending' },
    })
    expect(wrapper.text()).toBe('')
  })

  it('status="solved" 不包含文字，采用图标渲染', () => {
    const wrapper = mount(StatusTag, {
      props: { status: 'solved' },
    })
    expect(wrapper.text()).toBe('')
  })

  it('status="unsolved" 不包含文字，采用图标渲染', () => {
    const wrapper = mount(StatusTag, {
      props: { status: 'unsolved' },
    })
    expect(wrapper.text()).toBe('')
  })
})
