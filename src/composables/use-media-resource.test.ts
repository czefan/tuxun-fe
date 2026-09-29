import { effectScope, ref } from 'vue'
import { expect, it, vi } from 'vitest'
import { useMediaResource } from './use-media-resource'

it('替换和卸载释放 blob，忽略远端路径，卸载后的异步结果也释放', () => {
  const revoke = vi.fn()
  vi.stubGlobal('URL', { revokeObjectURL: revoke })
  const scope = effectScope()
  const path = ref('blob:first')
  const resource = scope.run(() => useMediaResource(path))!
  path.value = 'https://example.com/photo.png'
  expect(revoke).toHaveBeenCalledWith('blob:first')
  path.value = 'blob:second'
  scope.stop()
  expect(revoke).toHaveBeenCalledWith('blob:second')
  expect(resource.accept('blob:late')).toBe(false)
  expect(revoke).toHaveBeenCalledWith('blob:late')
  expect(revoke).toHaveBeenCalledTimes(3)
  vi.unstubAllGlobals()
})

it('较早选图的异步结果不覆盖新选择', () => {
  const revoke = vi.fn()
  vi.stubGlobal('URL', { revokeObjectURL: revoke })
  const scope = effectScope()
  const path = ref('')
  const resource = scope.run(() => useMediaResource(path))!
  const first = resource.beginSelection()
  const second = resource.beginSelection()
  expect(resource.accept('blob:new', second)).toBe(true)
  path.value = 'blob:new'
  expect(resource.accept('blob:old', first)).toBe(false)
  expect(revoke).toHaveBeenCalledWith('blob:old')
  expect(path.value).toBe('blob:new')
  scope.stop()
  vi.unstubAllGlobals()
})
