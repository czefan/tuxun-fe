const H5_IMAGE_PREVIEW_GUARD_KEY = '__tuxunImagePreviewBackGuard'

let imagePreviewOpen = false
let h5ImagePreviewGuardPushed = false
let h5ImagePreviewGuardRemoving = false
let h5ImagePreviewObserver: MutationObserver | undefined

export function previewImage(current: string, urls?: readonly string[]) {
  if (!current) {
    return
  }

  const previewUrls = urls?.length ? [...urls] : [current]
  markImagePreviewOpen()

  uni.previewImage({
    current,
    urls: previewUrls,
    fail: () => {
      markImagePreviewClosed({ removeH5Guard: true })
    },
  })
}

export function closeActivePreviewImage() {
  if (!imagePreviewOpen) {
    return false
  }

  markImagePreviewClosed({ removeH5Guard: true })
  closeNativePreviewImage()
  return true
}

export function handleImagePreviewBack() {
  // #ifdef H5
  if (h5ImagePreviewGuardRemoving) {
    h5ImagePreviewGuardRemoving = false
    h5ImagePreviewGuardPushed = false
    return true
  }

  h5ImagePreviewGuardPushed = false
  // #endif

  if (!imagePreviewOpen) {
    return false
  }

  markImagePreviewClosed({ removeH5Guard: false })
  closeNativePreviewImage()
  return true
}

export function installImagePreviewBackGuard() {
  // #ifdef H5
  window.addEventListener('popstate', handleH5ImagePreviewPopState, true)
  // #endif
}

export function uninstallImagePreviewBackGuard() {
  // #ifdef H5
  window.removeEventListener('popstate', handleH5ImagePreviewPopState, true)
  stopH5ImagePreviewObserver()
  // #endif
}

function markImagePreviewOpen() {
  imagePreviewOpen = true

  // #ifdef H5
  pushH5ImagePreviewGuard()
  observeH5ImagePreviewPortal()
  // #endif
}

function markImagePreviewClosed(options: { removeH5Guard: boolean }) {
  if (!imagePreviewOpen) {
    return
  }

  imagePreviewOpen = false

  // #ifdef H5
  stopH5ImagePreviewObserver()
  if (options.removeH5Guard) {
    removeH5ImagePreviewGuard()
  }
  // #endif
}

function closeNativePreviewImage() {
  uni.closePreviewImage({
    complete: () => {},
  })
}

function handleH5ImagePreviewPopState(event: PopStateEvent) {
  // #ifdef H5
  if (!imagePreviewOpen && !h5ImagePreviewGuardRemoving) {
    return
  }

  if (handleImagePreviewBack()) {
    event.preventDefault()
    event.stopImmediatePropagation()
  }
  // #endif
}

function pushH5ImagePreviewGuard() {
  // #ifdef H5
  if (h5ImagePreviewGuardPushed) {
    return
  }

  h5ImagePreviewGuardPushed = true
  const currentState = window.history.state
  const nextState = currentState && typeof currentState === 'object'
    ? { ...(currentState as Record<string, unknown>), [H5_IMAGE_PREVIEW_GUARD_KEY]: true }
    : { [H5_IMAGE_PREVIEW_GUARD_KEY]: true }

  window.history.pushState(nextState, '', window.location.href)
  // #endif
}

function removeH5ImagePreviewGuard() {
  // #ifdef H5
  if (!h5ImagePreviewGuardPushed) {
    return
  }

  if (window.history.state?.[H5_IMAGE_PREVIEW_GUARD_KEY]) {
    h5ImagePreviewGuardRemoving = true
    window.history.back()
    return
  }

  h5ImagePreviewGuardPushed = false
  // #endif
}

function observeH5ImagePreviewPortal() {
  // #ifdef H5
  stopH5ImagePreviewObserver()

  setTimeout(() => {
    const portal = document.getElementById('u-a-p')
    if (!portal || !imagePreviewOpen) {
      return
    }

    let hasSeenPreview = hasH5ImagePreviewElement(portal)

    h5ImagePreviewObserver = new MutationObserver(() => {
      if (!imagePreviewOpen) {
        return
      }

      const hasPreview = hasH5ImagePreviewElement(portal)
      if (hasPreview) {
        hasSeenPreview = true
        return
      }

      if (hasSeenPreview) {
        markImagePreviewClosed({ removeH5Guard: true })
      }
    })
    h5ImagePreviewObserver.observe(portal, { childList: true, subtree: true })
  }, 50)
  // #endif
}

function stopH5ImagePreviewObserver() {
  // #ifdef H5
  h5ImagePreviewObserver?.disconnect()
  h5ImagePreviewObserver = undefined
  // #endif
}

function hasH5ImagePreviewElement(root: Element) {
  // #ifdef H5
  const elements = [root, ...Array.from(root.querySelectorAll('div'))] as HTMLElement[]

  return elements.some((element) => {
    const style = window.getComputedStyle(element)
    return (
      style.position === 'fixed'
      && style.zIndex === '999'
      && style.backgroundColor.replace(/\s/g, '') === 'rgba(0,0,0,0.8)'
    )
  })
  // #endif

  // #ifndef H5
  return false
  // #endif
}
