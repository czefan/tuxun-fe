import {
  TX_BG_ACCENT,
  TX_BG_BROWN,
  TX_BG_MAIN,
  TX_BORDER_BROWN,
  TX_INK,
  TX_INK_2,
  TX_INK_3,
  TX_SURFACE,
  TX_TAB_INACTIVE,
} from '../constants'

export const theme = {
  colors: {
    /** 基础主题色，用法如: text-primary */
    'primary': 'var(--wot-color-theme,#0957DE)',
    /** 设计系统语义颜色 Token */
    'tx-main': TX_BG_MAIN,
    'tx-brown': TX_BG_BROWN,
    'tx-accent': TX_BG_ACCENT,
    'tx-border': TX_BORDER_BROWN,
    'tx-ink': TX_INK,
    'tx-ink-2': TX_INK_2,
    'tx-ink-3': TX_INK_3,
    'tx-surface': TX_SURFACE,
    'tx-tab-inactive': TX_TAB_INACTIVE,
  },
  borderRadius: {
    'tx-base': '15px',
  },
  fontSize: {
    /** 提供更小号的字体，用法如：text-2xs */
    '2xs': ['20rpx', '28rpx'],
    '3xs': ['18rpx', '26rpx'],
  },
}
