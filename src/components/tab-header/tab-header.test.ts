import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TabHeader from './tab-header.vue'

describe('tab-header 组件', () => {
  it('正确渲染选项并响应 Tab 点击切换', async () => {
    const wrapper = mount(TabHeader, {
      props: {
        modelValue: '全部',
        options: ['全部', '进行中', '已结束'] as const,
      },
    })

    const tabs = wrapper.findAll('.cursor-pointer')
    expect(tabs.length).toBe(3)
    expect(tabs[0].text()).toBe('全部')
    expect(tabs[1].text()).toBe('进行中')

    await tabs[1].trigger('tap')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['进行中'])
    expect(wrapper.emitted('tab-click')?.[0]).toEqual(['进行中'])
  })

  it('支持自定义 #label 与 #actions 插槽渲染', () => {
    const wrapper = mount(TabHeader, {
      props: {
        modelValue: '通知',
        options: ['通知', '互动'] as const,
      },
      slots: {
        label: `<template #label="{ option, active }"><span class="custom-label">{{ option }}-{{ active }}</span></template>`,
        actions: `<div class="test-actions">操作区</div>`,
      },
    })

    expect(wrapper.find('.custom-label').exists()).toBe(true)
    expect(wrapper.text()).toContain('通知-true')
    expect(wrapper.find('.test-actions').text()).toBe('操作区')
  })
})
