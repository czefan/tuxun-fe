import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import GoodDetailPopup from './good-detail-popup.vue'
import type { GoodsVM } from '../types'

const good = { id: 1, name: '纪念徽章', stock: 3, scorePrice: 10 } as GoodsVM

function setup() {
  let confirm!: NonNullable<UniApp.ShowModalOptions['success']>
  vi.mocked(uni.showModal).mockImplementation((options) => {
    confirm = options!.success!
    return undefined as never
  })
  const wrapper = mount(GoodDetailPopup, {
    props: { good, visible: true, isLoggedIn: true, userPoints: 30 },
    global: { stubs: { ProgressiveImage: true, 'wd-popup': { template: '<div><slot /></div>' } } },
  })
  return {
    wrapper,
    confirm: () => confirm({ confirm: true, cancel: false, errMsg: 'showModal:ok' }),
  }
}

describe('兑换确认状态', () => {
  it('确认期间重复点击只打开一次确认框', async () => {
    const { wrapper, confirm } = setup()
    await wrapper.find('wd-button-stub').trigger('click')
    await wrapper.find('wd-button-stub').trigger('click')
    expect(uni.showModal).toHaveBeenCalledTimes(1)
    confirm()
    expect(wrapper.emitted('exchange')).toEqual([[{ goodId: 1, quantity: 1 }]])
    wrapper.unmount()
  })

  it.each(['stock', 'points', 'pending', 'login', 'price'] as const)(
    '确认前 %s 变化不发送过期兑换',
    async (change) => {
      const { wrapper, confirm } = setup()
      await wrapper.find('wd-button-stub').trigger('click')
      if (change === 'stock') await wrapper.setProps({ good: { ...good, stock: 0 } })
      if (change === 'price') await wrapper.setProps({ good: { ...good, scorePrice: 20 } })
      if (change === 'points') await wrapper.setProps({ userPoints: 0 })
      if (change === 'pending') await wrapper.setProps({ isPending: true })
      if (change === 'login') await wrapper.setProps({ isLoggedIn: false })
      confirm()
      expect(wrapper.emitted('exchange')).toBeUndefined()
      wrapper.unmount()
    },
  )
})
