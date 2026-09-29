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

it('单张竖图由独立占位层撑高，图片始终覆盖容器并保留限高', () => {
  const wrapper = mount(ProgressiveImage, {
    props: {
      image: { url: '/portrait.jpg', originUrl: '/portrait.jpg', width: 600, height: 1200 },
      maxHeight: '60vh',
    },
  })
  expect(wrapper.find('.progressive-image__spacer').attributes('style')).toContain(
    'padding-bottom: 200%',
  )
  expect(wrapper.attributes('style')).toContain('max-height: 60vh')
  expect(wrapper.find('image').classes()).toEqual(
    expect.arrayContaining(['absolute', 'h-full', 'w-full']),
  )
  expect(wrapper.findAll('image')).toHaveLength(1)
  wrapper.unmount()
})

it('原图与缩略图使用同一定位层，切换不改变占位尺寸', async () => {
  const wrapper = mount(ProgressiveImage, {
    props: { image: { url: '/thumb.jpg', originUrl: '/full.jpg', width: 1200, height: 600 } },
  })
  const images = wrapper.findAll('image')
  for (const image of images) {
    expect(image.classes()).toEqual(expect.arrayContaining(['absolute', 'h-full', 'w-full']))
  }
  expect(images[1].classes()).toContain('opacity-0')
  await images[1].trigger('load')
  expect(images[1].classes()).not.toContain('opacity-0')
  expect(wrapper.find('.progressive-image__spacer').attributes('style')).toContain(
    'padding-bottom: 50%',
  )
  wrapper.unmount()
})
