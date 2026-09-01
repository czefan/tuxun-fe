import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ProgressiveImage from './progressive-image.vue'

describe('progressive-image 组件行为与守卫', () => {
  it('当缩略图与原图不同时，正确渲染底层缩略图与顶层原图', () => {
    const wrapper = mount(ProgressiveImage, {
      props: {
        image: {
          url: 'https://example.com/thumb.jpg',
          originUrl: 'https://example.com/origin.jpg',
          width: 800,
          height: 600,
        },
      },
    })

    const images = wrapper.findAll('image')
    expect(images.length).toBe(2)
    expect(images[0].attributes('src')).toBe('https://example.com/thumb.jpg')
    expect(images[1].attributes('src')).toBe('https://example.com/origin.jpg')
  })

  it('同图防重复守卫：当 url === originUrl 时，不开启缩略图占位层（只渲染单张原图）', () => {
    const wrapper = mount(ProgressiveImage, {
      props: {
        image: {
          url: 'https://example.com/same.jpg',
          originUrl: 'https://example.com/same.jpg',
          width: 800,
          height: 600,
        },
      },
    })

    const images = wrapper.findAll('image')
    expect(images.length).toBe(1)
    expect(images[0].attributes('src')).toBe('https://example.com/same.jpg')
  })

  it('支持外部 thumbUrl 覆盖，并正确响应点击事件', async () => {
    const wrapper = mount(ProgressiveImage, {
      props: {
        image: {
          url: 'https://example.com/thumb1.jpg',
          originUrl: 'https://example.com/origin.jpg',
          width: 800,
          height: 600,
        },
        thumbUrl: 'https://example.com/cached-thumb.jpg',
      },
    })

    const images = wrapper.findAll('image')
    expect(images[0].attributes('src')).toBe('https://example.com/cached-thumb.jpg')

    await images[0].trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })
})
