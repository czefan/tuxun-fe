import type { UserShortcuts } from 'unocss'

export const shortcuts: Extract<UserShortcuts, any[]> = [
  {
    // =========================================================================
    // 全站 Typography & Tab 核心 Token
    // =========================================================================

    // 1. 页面级大标题 (20px 粗黑)
    'u-title-page': 'text-xl text-tx-ink font-black tracking-tight',

    // 2. 弹窗标头 (18px 粗黑)
    'u-title-lg': 'text-lg text-tx-ink font-black tracking-tight',

    // 3. 卡片与列表项标题 (16px 常规)
    'u-title-base': 'text-base text-tx-ink font-normal leading-snug tracking-tight',
    'u-title-card':
      'text-base text-tx-ink font-medium leading-snug line-clamp-2 overflow-hidden break-all',

    // 4. 主要正文内容 (16px 评论/线索/主体)
    'u-body-main': 'text-base text-tx-ink font-medium leading-relaxed',

    // 5. 辅助说明正文 (14px 描述/提示)
    'u-body-sub': 'text-sm text-[#555555] font-normal leading-relaxed',

    // 6. 用户昵称 (16px/14px 不加黑)
    'u-user-name': 'text-base text-tx-ink font-medium leading-tight',

    // 7. 统一时间与日期 (14px 数字字体)
    // 数字字体栈是全局 CSS 自定义类 .font-numeric（见 styles/index.css），
    // 不是 unocss 工具类——直接用类名而非 shortcut，避免「unmatched utility」警告
    'u-meta-time': 'font-numeric text-sm text-tx-ink-2 font-medium leading-none',

    // 8. 微型注解与辅助单位 (12px 小字)
    'u-meta-sub': 'text-xs text-tx-ink-3 font-normal',

    // 9. 操作按钮与文本链接 (14px 品牌棕/高亮)
    'u-action-link': 'text-sm text-tx-brown font-bold cursor-pointer',

    // 10. Tab 选中态与未选中态
    'u-tab-active': 'text-base text-tx-ink font-black',
    'u-tab-inactive': 'text-base text-tx-ink-3 font-bold',
  },
]
