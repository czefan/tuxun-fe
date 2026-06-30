import { computed, ref } from 'vue'

interface ImagePickerOptions {
  limit: number
  sourceType?: Array<'album' | 'camera'>
}

interface ChosenLocation {
  name?: string
  address?: string
  latitude?: number
  longitude?: number
}

interface LocationTarget {
  address: string
  latitude: number
  longitude: number
}

interface LocationOptions {
  selectedText: string
  unselectedText: string
  failText: string
}

interface SubmitGuardOptions {
  loadingTitle?: string
  successTitle?: string
  failTitle?: string
  delay?: number
}

type ValidateForm = () => string
type SubmitTask = () => void | Promise<void>

export function useImagePicker(options: ImagePickerOptions) {
  const images = ref<string[]>([])
  const firstImage = computed(() => images.value[0] ?? '')

  function chooseImages() {
    const count = options.limit - images.value.length
    if (count <= 0) {
      return
    }

    uni.chooseImage({
      count,
      sizeType: ['compressed'],
      sourceType: options.sourceType ?? ['album', 'camera'],
      success: (res) => {
        const paths = normalizeTempFilePaths(res.tempFilePaths)
        images.value = [...images.value, ...paths].slice(0, options.limit)
      },
    })
  }

  function removeImage(index: number) {
    images.value.splice(index, 1)
  }

  return {
    images,
    firstImage,
    chooseImages,
    removeImage,
  }
}

export function useChosenLocation(target: LocationTarget, options: LocationOptions) {
  const hasLocation = computed(() => target.latitude !== 0 || target.longitude !== 0)
  const locationName = computed(() =>
    target.address || (hasLocation.value ? options.selectedText : options.unselectedText),
  )

  function chooseLocation() {
    uni.chooseLocation({
      success: (res: ChosenLocation) => {
        target.address = res.name || res.address || options.selectedText
        target.latitude = Number(res.latitude) || 0
        target.longitude = Number(res.longitude) || 0
      },
      fail: () => {
        uni.showToast({
          title: options.failText,
          icon: 'none',
        })
      },
    })
  }

  return {
    hasLocation,
    locationName,
    chooseLocation,
  }
}

export function useSubmitGuard(options: SubmitGuardOptions = {}) {
  const isSubmitting = ref(false)
  const loadingTitle = options.loadingTitle ?? '提交中'
  const successTitle = options.successTitle ?? '已提交'
  const failTitle = options.failTitle ?? '提交失败'
  const delay = options.delay ?? 500

  async function submitWithGuard(validate: ValidateForm, task?: SubmitTask) {
    if (isSubmitting.value) {
      return
    }

    const error = validate()
    if (error) {
      uni.showToast({
        title: error,
        icon: 'none',
      })
      return
    }

    isSubmitting.value = true
    uni.showLoading({ title: loadingTitle })

    let hasError = false

    try {
      if (task) {
        await task()
      }
      else {
        await wait(delay)
      }
    }
    catch {
      hasError = true
    }
    finally {
      uni.hideLoading()
      isSubmitting.value = false
      uni.showToast({
        title: hasError ? failTitle : successTitle,
        icon: hasError ? 'none' : 'success',
      })
    }
  }

  return {
    isSubmitting,
    submitWithGuard,
  }
}

function normalizeTempFilePaths(value: unknown) {
  const paths = Array.isArray(value) ? value : [value]
  return paths.filter((item): item is string => typeof item === 'string')
}

function wait(delay: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, delay)
  })
}
