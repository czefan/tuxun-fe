import { ref } from 'vue'
import { uploadAvatarImage } from '@/service/api'
import { useUserStore } from '@/store/user'

export function useAvatarEditor() {
  const userStore = useUserStore()
  const isAvatarSaving = ref(false)
  const avatarUploadUrl = import.meta.env.VITE_AVATAR_UPLOAD_URL || ''
  const editAvatarVisible = ref(false)

  function onAvatarTap() {
    if (!userStore.isLoggedIn()) {
      return
    }
    editAvatarVisible.value = true
  }

  function closeEditAvatar() {
    editAvatarVisible.value = false
  }

  function confirmEditAvatar() {
    closeEditAvatar()
    openAvatarCropper()
  }

  function openAvatarCropper() {
    if (!userStore.isLoggedIn()) {
      return
    }

    // #ifdef H5
    chooseH5AvatarImage()
    // #endif

    // #ifndef H5
    chooseNativeAvatarImage()
    // #endif
  }

  function onChooseAvatar(e: unknown) {
    const avatarUrl = getChooseAvatarUrl(e)
    if (avatarUrl) {
      void uploadAvatar(avatarUrl)
    }
  }

  function onChooseAvatarWithClose(e: unknown) {
    closeEditAvatar()
    onChooseAvatar(e)
  }

  function chooseNativeAvatarImage() {
    if (isAvatarSaving.value) {
      return
    }

    uni.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempPath = res.tempFilePaths[0]
        if (tempPath) {
          void uploadAvatar(tempPath)
        }
      },
    })
  }

  // #ifdef H5
  function chooseH5AvatarImage() {
    if (isAvatarSaving.value) {
      return
    }

    uni.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempPath = readChosenImagePath(res)

        if (!tempPath) {
          uni.showToast({ title: '未选择图片', icon: 'none' })
          return
        }

        void uploadAvatar(tempPath)
      },
      fail: (error) => {
        const message = typeof error?.errMsg === 'string' ? error.errMsg : ''

        if (!message.toLowerCase().includes('cancel')) {
          uni.showToast({ title: '选择图片失败', icon: 'none' })
        }
      },
    })
  }

  function readChosenImagePath(res: UniApp.ChooseImageSuccessCallbackResult) {
    const tempFilePaths = res.tempFilePaths

    if (Array.isArray(tempFilePaths) && tempFilePaths[0]) {
      return tempFilePaths[0]
    }

    const tempFiles = res.tempFiles
    const firstTempFile = Array.isArray(tempFiles) ? tempFiles[0] : tempFiles
    const path = (firstTempFile as { path?: string } | undefined)?.path

    return typeof path === 'string' ? path : ''
  }
  // #endif

  async function uploadAvatar(filePath: string, shouldToggleSaving = true) {
    if (shouldToggleSaving) {
      if (isAvatarSaving.value) {
        return
      }

      isAvatarSaving.value = true
    }

    let loadingShown = false

    try {
      if (!avatarUploadUrl) {
        updateAvatar(filePath)
        return
      }

      loadingShown = true
      uni.showLoading({ title: '正在上传头像...' })

      const avatar = await uploadAvatarImage(filePath, avatarUploadUrl)
      updateAvatar(avatar || filePath)
    }
    catch (error) {
      console.error('头像上传失败：', error)
      updateAvatar(filePath, '上传失败，已保留预览')
    }
    finally {
      if (loadingShown) {
        uni.hideLoading()
      }

      if (shouldToggleSaving) {
        isAvatarSaving.value = false
      }
    }
  }

  function updateAvatar(avatar: string, title = '头像修改成功') {
    userStore.updateUserInfo({ avatar })
    uni.showToast({ title, icon: title.includes('失败') ? 'none' : 'success' })
  }

  return {
    editAvatarVisible,
    onAvatarTap,
    closeEditAvatar,
    confirmEditAvatar,
    onChooseAvatarWithClose,
  }
}

function getChooseAvatarUrl(e: unknown) {
  if (!e || typeof e !== 'object') {
    return ''
  }

  const detail = (e as { detail?: unknown }).detail
  if (!detail || typeof detail !== 'object') {
    return ''
  }

  const avatarUrl = (detail as { avatarUrl?: unknown }).avatarUrl
  return typeof avatarUrl === 'string' ? avatarUrl : ''
}
