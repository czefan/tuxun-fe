import { describe, expect, it, vi } from 'vitest'
import { parseFormDraft, restoreDraftImage } from './form-draft'

describe('草稿恢复', () => {
  it.each([
    'broken',
    'null',
    '[]',
    '{"title":12,"latitude":91,"longitude":"12","activityId":-1,"coordType":"bad"}',
  ])('损坏数据不进入表单：%s', (raw) => {
    expect(parseFormDraft(raw)).toEqual({
      title: '',
      description: '',
      filePath: '',
      address: '',
      activityId: 0,
      latitude: 0,
      longitude: 0,
      coordType: 'gcj02',
    })
  })
  it('只恢复已知字段', () => {
    const result = parseFormDraft(
      '{"title":"校园","activityId":1,"latitude":30,"longitude":120,"coordType":"wgs84","__proto__":{"polluted":true}}',
    )
    expect(result).toMatchObject({
      title: '校园',
      latitude: 30,
      longitude: 120,
      coordType: 'wgs84',
    })
    expect(Object.hasOwn(result, '__proto__')).toBe(false)
  })
  it('图片过期时清空路径并提示重新选图', async () => {
    uni.getImageInfo = vi.fn((options) => {
      options.fail?.({ errMsg: 'expired' })
    }) as typeof uni.getImageInfo
    await expect(restoreDraftImage('blob:expired')).resolves.toBe('')
    expect(uni.showToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: '草稿图片已失效，请重新选择图片' }),
    )
  })
})
