import type { UserShortcuts } from 'unocss'

export const transitions: Extract<UserShortcuts, any[]> = [
  {
    // ==========================================
    // 1. 淡入淡出转场 (fade)
    // ==========================================
    'fade-enter-active': 'transition-opacity duration-300 ease-out',
    'fade-leave-active': 'transition-opacity duration-200 ease-in',
    'fade-enter-from': 'opacity-0',
    'fade-leave-to': 'opacity-0',

    // ==========================================
    // 2. 底部滑出转场 (slide-up)
    // ==========================================
    'slide-up-enter-active': 'transition-transform duration-300 ease-out',
    'slide-up-leave-active': 'transition-transform duration-200 ease-in',
    'slide-up-enter-from': 'translate-y-full',
    'slide-up-leave-to': 'translate-y-full',

    // ==========================================
    // 3. 缩放渐变转场 (scale-fade)
    // ==========================================
    'scale-fade-enter-active': 'transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1)',
    'scale-fade-leave-active': 'transition-all duration-200 ease-in',
    'scale-fade-enter-from': 'opacity-0 scale-90',
    'scale-fade-leave-to': 'opacity-0 scale-95',
  },
]
