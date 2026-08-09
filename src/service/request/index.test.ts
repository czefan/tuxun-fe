import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiRequestError, request, uploadFile } from './index'

// @uni-helper/uni-env 的 isH5 在模块加载时从 process.env.UNI_PLATFORM 固化成了常量，
// 用例内无法直接改写。这里用 getter 让每次访问都取当前状态，从而可控地测两条平台分支。
const uniEnvState = vi.hoisted(() => ({ isH5: false, isMpWeixin: false }))

vi.mock('@uni-helper/uni-env', () => ({
  get isH5() { return uniEnvState.isH5 },
  get isMpWeixin() { return uniEnvState.isMpWeixin },
}))

// Mock 模式的用例会 stub VITE_ENABLE_MOCK=true，此时 http.ts 会动态 import('@/mocks')
// 并执行 setupWorker —— 非浏览器环境必炸。这里只关心 URL 拼装，把 mock 初始化直接桩掉。
vi.mock('@/mocks', () => ({
  ensureMockReady: async () => {},
}))

function mockRequestSuccess(res: Partial<UniApp.RequestSuccessCallbackResult> = {}) {
  vi.mocked(uni.request).mockImplementation((options) => {
    options.success?.({
      statusCode: 200,
      data: { code: 0, success: true, resp: { id: 1 } },
      header: {},
      cookies: [],
      errMsg: 'request:ok',
      ...res,
    } as UniApp.RequestSuccessCallbackResult)
    return {} as ReturnType<typeof uni.request>
  })
}

function mockUploadSuccess(res: UniApp.UploadFileSuccessCallbackResult) {
  vi.mocked(uni.uploadFile).mockImplementation((options) => {
    options.success?.(res)
    return {} as ReturnType<typeof uni.uploadFile>
  })
}

describe('request URL resolution', () => {
  beforeEach(() => {
    vi.mocked(uni.request).mockReset()
  })

  it('keeps absolute HTTP URLs unchanged', async () => {
    mockRequestSuccess()
    await request({ url: 'http://external.com/api/test' })
    expect(uni.request).toHaveBeenCalledWith(expect.objectContaining({
      url: 'http://external.com/api/test',
    }))
  })

  it('appends /api prefix to relative path if not present', async () => {
    mockRequestSuccess()
    await request({ url: '/photos' })
    expect(uni.request).toHaveBeenCalledWith(expect.objectContaining({
      url: expect.stringMatching(/\/api\/photos$/),
    }))
  })

  it('does not duplicate /api prefix when already present', async () => {
    mockRequestSuccess()
    await request({ url: '/api/photos' })
    expect(uni.request).toHaveBeenCalledWith(expect.objectContaining({
      url: expect.stringMatching(/\/api\/photos$/),
    }))
    expect(uni.request).not.toHaveBeenCalledWith(expect.objectContaining({
      url: expect.stringMatching(/\/api\/api\/photos$/),
    }))
  })

  it('h5 平台开启代理时走 /fg-api 前缀', async () => {
    uniEnvState.isH5 = true
    vi.stubEnv('VITE_APP_PROXY_ENABLE', 'true')
    vi.stubEnv('VITE_ENABLE_MOCK', 'false')
    vi.stubEnv('VITE_APP_PROXY_PREFIX', '/fg-api')
    mockRequestSuccess()
    await request({ url: '/photos' })
    expect(uni.request).toHaveBeenCalledWith(expect.objectContaining({
      url: '/fg-api/api/photos',
    }))
  })

  it('h5 平台关闭代理时走 baseUrl 直连', async () => {
    uniEnvState.isH5 = true
    vi.stubEnv('VITE_APP_PROXY_ENABLE', 'false')
    vi.stubEnv('VITE_ENABLE_MOCK', 'false')
    vi.stubEnv('VITE_SERVER_BASEURL', 'http://backend.test')
    mockRequestSuccess()
    await request({ url: '/photos' })
    expect(uni.request).toHaveBeenCalledWith(expect.objectContaining({
      url: 'http://backend.test/api/photos',
    }))
  })

  it('非 H5（小程序）即使代理开启也绝不能加 /fg-api 前缀（相对路径在 uni.request 下非法）', async () => {
    uniEnvState.isH5 = false
    vi.stubEnv('VITE_APP_PROXY_ENABLE', 'true')
    vi.stubEnv('VITE_ENABLE_MOCK', 'false')
    vi.stubEnv('VITE_APP_PROXY_PREFIX', '/fg-api')
    vi.stubEnv('VITE_SERVER_BASEURL', 'https://mp-backend.test')
    mockRequestSuccess()
    await request({ url: '/photos' })
    expect(uni.request).toHaveBeenCalledWith(expect.objectContaining({
      url: 'https://mp-backend.test/api/photos',
    }))
    expect(uni.request).not.toHaveBeenCalledWith(expect.objectContaining({
      url: expect.stringContaining('/fg-api'),
    }))
  })

  it('mock 模式即使代理开启也不加前缀', async () => {
    uniEnvState.isH5 = true
    vi.stubEnv('VITE_APP_PROXY_ENABLE', 'true')
    vi.stubEnv('VITE_ENABLE_MOCK', 'true')
    vi.stubEnv('VITE_APP_PROXY_PREFIX', '/fg-api')
    mockRequestSuccess()
    await request({ url: '/photos' })
    expect(uni.request).toHaveBeenCalledWith(expect.objectContaining({
      url: expect.stringMatching(/\/api\/photos$/),
    }))
    expect(uni.request).not.toHaveBeenCalledWith(expect.objectContaining({
      url: expect.stringContaining('/fg-api'),
    }))
  })
})

afterEach(() => {
  vi.unstubAllEnvs()
})

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

  it('passes multiple upload files through to uni.uploadFile', async () => {
    mockUploadSuccess({
      statusCode: 200,
      data: JSON.stringify({ success: true, resp: { id: 1 } }),
    } as UniApp.UploadFileSuccessCallbackResult)

    await expect(uploadFile<{ id: number }>({
      url: '/api/feedback',
      files: [
        { name: 'image_file1', uri: '/tmp/1.png' },
        { name: 'image_file2', uri: '/tmp/2.png' },
      ],
      formData: {
        title: '反馈',
        content: '内容',
        type: 1,
      },
    })).resolves.toEqual({ id: 1 })

    expect(uni.uploadFile).toHaveBeenCalledWith(expect.objectContaining({
      files: [
        { name: 'image_file1', uri: '/tmp/1.png' },
        { name: 'image_file2', uri: '/tmp/2.png' },
      ],
    }))
  })

  it('rejects when no upload file is provided', async () => {
    await expect(uploadFile({
      url: '/api/feedback',
    })).rejects.toBeInstanceOf(ApiRequestError)
    expect(uni.uploadFile).not.toHaveBeenCalled()
  })
})
