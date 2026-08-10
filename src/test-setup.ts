import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, vi } from 'vitest'

// 每个测试前重置 Pinia 实例
beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

/** uni storage 的内存实现：同步 API 要能真正存取值（如登录回跳路径、草稿箱），不能只返回 null */
const storageStore = new Map<string, unknown>()
beforeEach(() => {
  storageStore.clear()
})

/** 在 Node 测试环境下模拟 uni.request -> 原生 fetch，以便 MSW Node server 正确拦截 */
async function uniRequestPolyfill(options: any) {
  try {
    const url = options.url.startsWith('http')
      ? options.url
      : `http://localhost${options.url.startsWith('/') ? '' : '/'}${options.url}`

    let fullUrl = url
    if (options.query) {
      const searchParams = new URLSearchParams()
      Object.entries(options.query).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          searchParams.append(k, String(v))
        }
      })
      const queryString = searchParams.toString()
      if (queryString) {
        fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.header,
    }

    const fetchOptions: RequestInit = {
      method: options.method || 'GET',
      headers,
    }

    if (options.data && options.method && options.method !== 'GET') {
      fetchOptions.body = typeof options.data === 'string' ? options.data : JSON.stringify(options.data)
    }

    const response = await fetch(fullUrl, fetchOptions)
    const data = await response.json()

    const res = {
      statusCode: response.status,
      data,
      header: Object.fromEntries(response.headers.entries()),
    }

    if (options.success)
      options.success(res)
    if (options.complete)
      options.complete(res)
    return res
  }
  catch (err) {
    if (options.fail)
      options.fail(err)
    if (options.complete)
      options.complete(err)
    throw err
  }
}

async function uniUploadPolyfill(options: any) {
  try {
    const url = options.url.startsWith('http')
      ? options.url
      : `http://localhost${options.url.startsWith('/') ? '' : '/'}${options.url}`

    // 真实构造 multipart body：只有把表单字段名发出去，
    // 契约守卫才能校验 image_file / avatar 这类字段名有没有写错。
    const form = new FormData()
    if (options.filePath) {
      form.append(options.name || 'file', new Blob(['mock-binary']), 'mock.jpg')
    }
    for (const file of options.files || []) {
      form.append(file.name || 'file', new Blob(['mock-binary']), 'mock.jpg')
    }
    for (const [key, value] of Object.entries(options.formData || {})) {
      if (value !== undefined && value !== null) {
        form.append(key, String(value))
      }
    }

    const response = await fetch(url, {
      method: options.method || 'POST',
      headers: options.header || {},
      body: form,
    })
    const data = await response.json()

    const res = {
      statusCode: response.status,
      data,
      header: Object.fromEntries(response.headers.entries()),
    }

    if (options.success)
      options.success(res)
    if (options.complete)
      options.complete(res)
    return res
  }
  catch (err) {
    if (options.fail)
      options.fail(err)
    if (options.complete)
      options.complete(err)
    throw err
  }
}

// 全局 mock uni 对象
const uniMock = {
  showToast: vi.fn(),
  addInterceptor: vi.fn(),
  removeInterceptor: vi.fn(),
  hideToast: vi.fn(),
  showLoading: vi.fn(),
  hideLoading: vi.fn(),
  showModal: vi.fn(),
  navigateTo: vi.fn(),
  redirectTo: vi.fn(),
  navigateBack: vi.fn(),
  switchTab: vi.fn(),
  reLaunch: vi.fn(),
  // key 不存在时返回空串，与 uni 真实行为一致（调用方常以 falsy 判断）
  getStorageSync: vi.fn().mockImplementation((key: string) => {
    return storageStore.has(key) ? storageStore.get(key) : ''
  }),
  setStorageSync: vi.fn().mockImplementation((key: string, value: unknown) => {
    storageStore.set(key, value)
  }),
  removeStorageSync: vi.fn().mockImplementation((key: string) => {
    storageStore.delete(key)
  }),
  getStorageInfoSync: vi.fn().mockReturnValue({ keys: [], currentSize: 0, limitSize: 0 }),
  getStorage: vi.fn(),
  setStorage: vi.fn(),
  removeStorage: vi.fn(),
  request: vi.fn().mockImplementation(uniRequestPolyfill),
  uploadFile: vi.fn().mockImplementation(uniUploadPolyfill),
  chooseImage: vi.fn(),
  getSystemInfoSync: vi.fn().mockReturnValue({ platform: 'devtools' }),
  getSystemInfo: vi.fn(),
  getLocale: vi.fn().mockReturnValue('zh-Hans'),
  onNetworkStatusChange: vi.fn(),
  getNetworkType: vi.fn(),
}

Object.defineProperty(globalThis, 'uni', {
  value: uniMock,
  writable: true,
  configurable: true,
})

Object.defineProperty(globalThis, 'getCurrentPages', {
  value: vi.fn().mockReturnValue([{ route: 'pages/index/index' }]),
  writable: true,
  configurable: true,
})
