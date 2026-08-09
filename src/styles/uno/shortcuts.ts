import type { UserShortcuts } from 'unocss'

export const shortcuts: Extract<UserShortcuts, any[]> = [
  {
    'center': 'flex justify-center items-center',
    'u-circle-btn': 'flex items-center justify-center flex-shrink-0 w-62rpx h-62rpx bg-white border-2rpx border-solid border-[rgba(31,27,20,0.08)] rounded-full shadow-[0_8rpx_20rpx_rgba(31,26,18,0.05)] box-border',
    'u-page-viewport': 'safe-bottom-page flex flex-col h-100vh pt-34rpx bg-[#f6f4ef] box-border',
    'u-header-flex': 'flex items-start justify-between gap-18rpx px-24rpx pb-28rpx pt-4rpx',
    'u-list-wrapper': 'flex flex-col gap-18rpx px-24rpx pt-16rpx',
    'u-card-item': 'flex gap-18rpx p-18rpx bg-white border border-solid border-[rgba(31,27,20,0.06)] rounded-18rpx shadow-[0_8rpx_24rpx_rgba(31,27,20,0.05)]',
    'u-card-cover': 'flex-shrink-0 w-150rpx h-150rpx bg-[#eeeeee] rounded-14rpx',
    'u-card-main': 'flex flex-col justify-between flex-1 min-w-0 h-150rpx box-border py-4rpx',
    'u-card-title': 'block line-clamp-2 text-29rpx font-900 leading-[1.35] text-[#1f1b14]',

    // =========================================================================
    // 精简为 9 个全站 Typography 核心 Token (≤ 10 个)
    // =========================================================================

    // 1. 页面级大标题 (20px 粗黑)
    'u-title-xl': 'text-xl text-[#1E1E1E] font-black tracking-tight',
    'u-title-page': 'text-xl text-[#1E1E1E] font-black tracking-tight',

    // 2. 弹窗标头 (18px 粗黑)
    'u-title-lg': 'text-lg text-[#1E1E1E] font-black tracking-tight',

    // 3. 卡片与列表项标题 (16px 常规)
    'u-title-base': 'text-base text-[#1E1E1E] font-normal leading-snug tracking-tight',
    'u-title-card': 'text-base text-[#1E1E1E] font-medium leading-snug line-clamp-2 overflow-hidden break-all',

    // 4. 主要正文内容 (16px 评论/线索/主体)
    'u-body-main': 'text-base text-[#1E1E1E] font-medium leading-relaxed',

    // 5. 辅助说明正文 (14px 描述/提示)
    'u-body-sub': 'text-sm text-[#555555] font-normal leading-relaxed',

    // 6. 用户昵称 (16px/14px 不加黑)
    'u-user-name': 'text-base text-[#1E1E1E] font-medium leading-tight',

    // 7. 统一时间与日期 (14px 数字字体)
    'u-meta-time': 'font-num text-sm text-[#756C5E] font-medium leading-none',

    // 8. 微型注解与辅助单位 (12px 小字)
    'u-meta-sub': 'text-xs text-[#8A7E70] font-normal',

    // 9. 操作按钮与文本链接 (14px 品牌棕/高亮)
    'u-action-link': 'text-sm text-[#B69171] font-bold cursor-pointer',
    'u-tab-active': 'text-base text-[#1E1E1E] font-bold',
    'u-tab-inactive': 'text-base text-[#8A7E70] font-bold',

    // 表单与卡片样式迁移 (Form & Card Styles)
    'form-field': 'p-[16rpx_24rpx_24rpx] bg-white border border-solid border-[rgba(31,27,20,0.07)] rounded-18rpx shadow-[0_10rpx_28rpx_rgba(31,27,20,0.05)]',
    'field-top': 'flex items-center justify-between gap-18rpx mb-16rpx',
    'form-label': 'block text-26rpx font-900 text-[#1f1b14] mb-16rpx',
    'form-input': 'w-full h-82rpx px-22rpx bg-[#f8f6f2] border border-solid border-[rgba(31,27,20,0.06)] rounded-14rpx box-border text-[#1f1b14] text-28rpx',
    'form-textarea': 'w-full min-h-140rpx max-h-320rpx overflow-y-auto py-20rpx px-22rpx bg-[#f8f6f2] border border-solid border-[rgba(31,27,20,0.06)] rounded-14rpx box-border text-[#1f1b14] text-28rpx leading-1.45',
    'form-placeholder': 'text-[#b6afa4]',
    'form-count': 'mt-12rpx text-right text-22rpx text-[#9a9286]',
    'location-box': 'p-[20rpx_22rpx] bg-[#f8f6f2] border border-solid border-[rgba(31,27,20,0.06)] rounded-14rpx box-border',
    'location-box__name': 'text-28rpx font-800 text-[#1f1b14]',
    'location-box__address': 'mt-8rpx text-22rpx leading-1.4 text-[#8f8679]',
    'location-box__coord': 'mt-8rpx text-22rpx leading-1.4 text-[#8f8679]',

    // 布局类样式迁移 (Layout Styles)
    'fixed-bottom-bar': 'fixed right-0 bottom--1px left-0 z-99 bg-white border-t border-t-solid border-t-[rgba(31,27,20,0.06)] box-border',
    'font-num': 'font-numeric',
  },
]
