import * as Vue from 'vue'
import { computed, getCurrentInstance, h, onUnmounted, watch } from 'vue'
import {
  questionTransitionDuration,
  useQuestionTransitionStore,
} from './store'
import type { QuestionTransitionFlight, QuestionTransitionRect } from './store'
import { renderQuestionTransitionMarkup } from './render'
import { useSystemInfo } from '@/composables/useSystemInfo'
import LikeButton from '@/components/like-button/like-button.vue'

interface OverlayElements {
  backdrop: HTMLElement
  frame: HTMLElement
  page: HTMLElement
  clone: HTMLElement
  bottom: HTMLElement
}

type OverlayKeyframes = Record<keyof OverlayElements, Keyframe[]>

const transitionEasing = 'cubic-bezier(0.22, 1, 0.36, 1)'
const identityTransform = 'translate3d(0, 0, 0) scale(1, 1)'
const overlaySelectors: Record<keyof OverlayElements, string> = {
  backdrop: '.question-global-transition__backdrop',
  frame: '.question-global-transition__frame',
  page: '.question-global-transition__page',
  clone: '.question-global-transition__clone',
  bottom: '.question-global-transition__bottom',
}

export function useQuestionTransitionOverlay() {
  const transitionStore = useQuestionTransitionStore()
  const { statusBarHeight, windowWidth, windowHeight } = useSystemInfo()
  const appContext = getCurrentInstance()?.appContext ?? null
  const flight = computed(() => transitionStore.flight)
  const navBarStyle = computed(() => `padding-top: ${statusBarHeight.value}px;`)

  let overlayRoot: HTMLElement | null = null
  let renderedFlightKey = ''
  let activeAnimations: Animation[] = []
  let activeAnimationKey = ''
  let activeAnimationToken = 0
  let playedFlightKey = ''
  let mountedLikeButtonRoots: HTMLElement[] = []

  watch(
    () => flight.value,
    () => {
      syncGlobalTransitionOverlay()
    },
    { deep: true, flush: 'post' },
  )

  onUnmounted(() => {
    removeGlobalTransitionOverlay()
  })

  function syncGlobalTransitionOverlay() {
    // #ifndef H5
    return
    // #endif

    // #ifdef H5
    if (!flight.value) {
      removeGlobalTransitionOverlay()
      return
    }

    syncGlobalTransitionOverlayH5(flight.value as QuestionTransitionFlight)
    // #endif
  }

  function syncGlobalTransitionOverlayH5(currentFlight: QuestionTransitionFlight) {
    const root = ensureGlobalTransitionOverlay()
    const flightKey = `${currentFlight.mode}-${currentFlight.question.id}`

    if (flightKey !== renderedFlightKey) {
      renderedFlightKey = flightKey
      unmountTransitionLikeButtons()
      root.innerHTML = renderQuestionTransitionMarkup(currentFlight, navBarStyle.value)
      mountTransitionLikeButtons(root)
    }

    root.className = [
      'question-global-transition',
      `question-global-transition--${currentFlight.mode}`,
      currentFlight.playing ? 'question-global-transition--play' : '',
    ]
      .filter(Boolean)
      .join(' ')

    const elements = getOverlayElements(root)

    if (elements) {
      syncFlight(elements, currentFlight)
    }
  }

  function syncFlight(elements: OverlayElements, currentFlight: QuestionTransitionFlight) {
    const { frame, clone, bottom } = elements
    const cardRect = currentFlight.cardRect
    const isLeave = currentFlight.mode === 'leave'
    const flightKey = `${currentFlight.mode}-${currentFlight.question.id}`

    const screenWidth = window.innerWidth || windowWidth.value || 1
    const screenHeight = window.innerHeight || windowHeight.value || 1

    frame.style.transformOrigin = '0 0'
    frame.style.top = '0'
    frame.style.width = `${screenWidth}px`
    frame.style.height = `${screenHeight}px`

    if (cardRect) {
      applyCloneLayerRect(clone, cardRect, screenWidth, screenHeight)
    }

    if (!currentFlight.playing || !cardRect) {
      if (flightKey === playedFlightKey) {
        return
      }

      cancelActiveAnimations()
      activeAnimationKey = ''

      const small = cardRect ? getPageTransform(cardRect, screenWidth, screenHeight) : identityTransform
      applyStartState(elements, isLeave, small)

      if (overlayRoot) {
        overlayRoot.style.clipPath = 'none'
      }
      return
    }

    const animationKey = `${currentFlight.mode}-${currentFlight.question.id}-${rectKey(cardRect)}`

    if (animationKey === activeAnimationKey) {
      return
    }

    activeAnimationKey = animationKey
    playedFlightKey = flightKey
    cancelActiveAnimations()

    const frames = getFlightKeyframes(isLeave, getPageTransform(cardRect, screenWidth, screenHeight))
    const chromeInset = getChromeInsets()
    const hasTransitionBottom
      = typeof document !== 'undefined' && !!document.querySelector('[data-transition-bottom]')
    const hasClip = (hasTransitionBottom || isLeave) && (chromeInset.top > 0 || chromeInset.bottom > 0)
    const clipFrom = isLeave ? 'inset(0px 0px 0px 0px)' : `inset(${chromeInset.top}px 0px ${chromeInset.bottom}px 0px)`
    const clipTo = isLeave ? `inset(${chromeInset.top}px 0px ${chromeInset.bottom}px 0px)` : 'inset(0px 0px 0px 0px)'

    applyFirstKeyframes(elements, frames)
    if (overlayRoot) {
      overlayRoot.style.clipPath = hasClip ? clipFrom : 'none'
    }
    frame.getBoundingClientRect()

    const token = ++activeAnimationToken
    const options: KeyframeAnimationOptions = {
      duration: questionTransitionDuration,
      easing: transitionEasing,
      fill: 'forwards',
    }

    activeAnimations = animateElements(elements, frames, options)

    if (hasClip && overlayRoot) {
      activeAnimations.push(
        overlayRoot.animate([{ clipPath: clipFrom }, { clipPath: clipTo }], options),
      )
    }

    activeAnimations[0].onfinish = () => {
      if (token !== activeAnimationToken) {
        return
      }

      applyLastKeyframes(elements, frames)
      if (overlayRoot) {
        overlayRoot.style.clipPath = hasClip ? clipTo : 'none'
      }
    }
  }

  function ensureGlobalTransitionOverlay() {
    if (overlayRoot) {
      return overlayRoot
    }

    overlayRoot = document.createElement('div')
    document.body.appendChild(overlayRoot)
    return overlayRoot
  }

  function removeGlobalTransitionOverlay() {
    // #ifdef H5
    unmountTransitionLikeButtons()

    if (overlayRoot?.parentNode) {
      overlayRoot.parentNode.removeChild(overlayRoot)
    }

    overlayRoot = null
    renderedFlightKey = ''
    activeAnimationKey = ''
    playedFlightKey = ''
    cancelActiveAnimations()
    // #endif
  }

  function cancelActiveAnimations() {
    activeAnimationToken += 1
    activeAnimations.forEach((animation) => {
      animation.onfinish = null
      animation.oncancel = null
      animation.cancel()
    })
    activeAnimations = []
  }

  function mountTransitionLikeButtons(root: HTMLElement) {
    const mounts = root.querySelectorAll<HTMLElement>('[data-transition-like]')

    mounts.forEach((mount) => {
      const vnode = h(LikeButton, {
        liked: mount.dataset.liked === '1',
        count: mount.dataset.count ?? '',
        size: normalizeLikeButtonSize(mount.dataset.size),
        iconSize: mount.dataset.iconSize || undefined,
        fontSize: mount.dataset.fontSize || undefined,
        readonly: true,
        class: mount.dataset.buttonClass || undefined,
      })

      if (appContext) {
        vnode.appContext = appContext
      }

      getVueRender()(vnode, mount)
      mountedLikeButtonRoots.push(mount)
    })
  }

  function unmountTransitionLikeButtons() {
    mountedLikeButtonRoots.forEach((root) => {
      getVueRender()(null, root)
    })
    mountedLikeButtonRoots = []
  }
}

type VueRender = (vnode: ReturnType<typeof h> | null, container: HTMLElement) => void

function getVueRender() {
  const renderKey = ['render'].join('')
  return (Vue as unknown as Record<string, VueRender>)[renderKey]
}

function normalizeLikeButtonSize(size: string | undefined): 'sm' | 'md' | 'lg' {
  return size === 'md' || size === 'lg' ? size : 'sm'
}

function getOverlayElements(root: HTMLElement): OverlayElements | null {
  const entries = Object.entries(overlaySelectors).map(([key, selector]) => [
    key,
    root.querySelector<HTMLElement>(selector),
  ])

  if (entries.some(([, element]) => !element)) {
    return null
  }

  return Object.fromEntries(entries) as OverlayElements
}

function applyStartState(elements: OverlayElements, isLeave: boolean, small: string) {
  const { backdrop, frame, page, clone, bottom } = elements

  frame.style.transform = isLeave ? identityTransform : small
  page.style.opacity = isLeave ? '1' : '0'
  clone.style.opacity = isLeave ? '0' : '1'
  backdrop.style.opacity = '0'
  bottom.style.transform = isLeave ? 'translateY(0)' : 'translateY(100%)'
}

function getFlightKeyframes(isLeave: boolean, small: string): OverlayKeyframes {
  return {
    frame: isLeave
      ? [{ transform: identityTransform }, { transform: small }]
      : [{ transform: small }, { transform: identityTransform }],
    page: opacityFrames(isLeave),
    clone: opacityFrames(!isLeave),
    backdrop: isLeave ? [{ opacity: 0 }, { opacity: 0 }] : [{ opacity: 0 }, { opacity: 1 }],
    bottom: isLeave
      ? [{ transform: 'translateY(0)' }, { transform: 'translateY(100%)' }]
      : [{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }],
  }
}

function opacityFrames(visibleFirst: boolean): Keyframe[] {
  return visibleFirst
    ? [
        { opacity: 1, offset: 0 },
        { opacity: 1, offset: 0.20 },
        { opacity: 0, offset: 0.75 },
        { opacity: 0, offset: 1 },
      ]
    : [
        { opacity: 0, offset: 0 },
        { opacity: 0, offset: 0.25 },
        { opacity: 1, offset: 0.80 },
        { opacity: 1, offset: 1 },
      ]
}

function applyFirstKeyframes(elements: OverlayElements, frames: OverlayKeyframes) {
  applyAllKeyframes(elements, frames, 'first')
}

function applyLastKeyframes(elements: OverlayElements, frames: OverlayKeyframes) {
  applyAllKeyframes(elements, frames, 'last')
}

function applyAllKeyframes(
  elements: OverlayElements,
  frames: OverlayKeyframes,
  position: 'first' | 'last',
) {
  ;(Object.keys(frames) as Array<keyof OverlayElements>).forEach((key) => {
    const keyframes = frames[key]
    applyKeyframe(elements[key], position === 'first' ? keyframes[0] : keyframes[keyframes.length - 1])
  })
}

function animateElements(
  elements: OverlayElements,
  frames: OverlayKeyframes,
  options: KeyframeAnimationOptions,
) {
  return (Object.keys(frames) as Array<keyof OverlayElements>).map(key =>
    elements[key].animate(frames[key], options),
  )
}

function applyKeyframe(element: HTMLElement, keyframe: Keyframe) {
  if (keyframe.transform !== undefined) {
    element.style.transform = String(keyframe.transform)
  }

  if (keyframe.opacity !== undefined) {
    element.style.opacity = String(keyframe.opacity)
  }
}

function getPageTransform(
  cardRect: QuestionTransitionRect,
  screenWidth: number,
  screenHeight: number,
) {
  const scaleX = cardRect.width / screenWidth
  const scaleY = cardRect.height / screenHeight

  return `translate3d(${cardRect.left}px, ${cardRect.top}px, 0) scale(${scaleX}, ${scaleY})`
}

function getChromeInsets() {
  const readVarPx = (name: string) => {
    const raw
      = document.documentElement.style.getPropertyValue(name)
        || getComputedStyle(document.documentElement).getPropertyValue(name)
    const matched = raw.match(/-?\d+(?:\.\d+)?/)
    return matched ? Number.parseFloat(matched[0]) : 0
  }
  const { statusBarHeight } = useSystemInfo()
  const safeTop = statusBarHeight.value
  const head = document.querySelector('uni-page-head')
  const headRect = head ? head.getBoundingClientRect() : null
  let top = headRect && headRect.height > 1 ? Math.max(0, headRect.bottom) : 0

  if (top <= 0) {
    const winTop = readVarPx('--window-top')
    top = winTop > 0 ? winTop + safeTop : 0
  }

  const tabBar = document.querySelector('uni-tabbar')
  const tabRect = tabBar ? tabBar.getBoundingClientRect() : null
  let bottom = tabRect && tabRect.height > 1 ? tabRect.height : 0

  const customBottom = document.querySelector('[data-transition-bottom]')
  const customBottomRect = customBottom ? customBottom.getBoundingClientRect() : null
  const customBottomHeight
    = customBottomRect && customBottomRect.height > 1 ? Math.max(0, customBottomRect.height) : 0

  bottom = Math.max(bottom, customBottomHeight)

  if (bottom <= 0) {
    bottom = readVarPx('--window-bottom')
  }

  return { top, bottom }
}

function applyCloneLayerRect(
  element: HTMLElement,
  rect: QuestionTransitionRect,
  screenWidth: number,
  screenHeight: number,
) {
  element.style.top = '0'
  element.style.left = '0'
  element.style.width = `${rect.width}px`
  element.style.height = `${rect.height}px`
  element.style.transformOrigin = '0 0'
  element.style.transform = `scale(${screenWidth / rect.width}, ${screenHeight / rect.height})`
}

function rectKey(rect: QuestionTransitionRect) {
  return [rect.top, rect.left, rect.width, rect.height].map(value => Math.round(value)).join(',')
}
