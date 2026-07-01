import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiRequestError, uploadFile } from './index'

function mockUploadSuccess(res: UniApp.UploadFileSuccessCallbackResult) {
  vi.mocked(uni.uploadFile).mockImplementation((options) => {
    options.success?.(res)
    return {} as ReturnType<typeof uni.uploadFile>
  })
}

describe('uploadFile', () => {
  beforeEach(() => {
    vi.mocked(uni.uploadFile).mockReset()
  })

  it('unwraps successful response envelope data', async () => {
    mockUploadSuccess({
      statusCode: 200,
      data: JSON.stringify({ code: 0, data: { url: '/avatar.png' } }),
    } as UniApp.UploadFileSuccessCallbackResult)

    await expect(uploadFile<{ url: string }>({
      url: '/api/upload/avatar',
      filePath: '/tmp/avatar.png',
    })).resolves.toEqual({ url: '/avatar.png' })
  })

  it('resolves raw upload response when no business code exists', async () => {
    mockUploadSuccess({
      statusCode: 200,
      data: JSON.stringify({ url: '/raw.png' }),
    } as UniApp.UploadFileSuccessCallbackResult)

    await expect(uploadFile<{ url: string }>({
      url: '/api/upload/avatar',
      filePath: '/tmp/avatar.png',
    })).resolves.toEqual({ url: '/raw.png' })
  })

  it('rejects business errors and respects hideErrorToast', async () => {
    mockUploadSuccess({
      statusCode: 200,
      data: JSON.stringify({ code: 500, message: '上传失败，请重试' }),
    } as UniApp.UploadFileSuccessCallbackResult)

    await expect(uploadFile({
      url: '/api/upload/avatar',
      filePath: '/tmp/avatar.png',
      hideErrorToast: true,
    })).rejects.toBeInstanceOf(ApiRequestError)
    expect(uni.showToast).not.toHaveBeenCalled()
  })
})
