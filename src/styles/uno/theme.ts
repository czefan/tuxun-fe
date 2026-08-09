import {
  BRAND_PRIMARY_COLOR,
  BRAND_PRIMARY_DARK_COLOR,
  BRAND_PRIMARY_LIGHT_COLOR,
  TX_BG_ACCENT,
  TX_BG_BROWN,
  TX_BG_MAIN,
  TX_BORDER_BROWN,
} from '../constants'

export const theme = {
  colors: {
    /** 主题色，用法如: text-primary */
    'primary': 'var(--wot-color-theme,#0957DE)',
    'brand': BRAND_PRIMARY_COLOR,
    'brand-dark': BRAND_PRIMARY_DARK_COLOR,
    'brand-light': BRAND_PRIMARY_LIGHT_COLOR,
    /** tmp/design 权威设计 Token */
    'tx-main': TX_BG_MAIN,
    'tx-brown': TX_BG_BROWN,
    'tx-accent': TX_BG_ACCENT,
    'tx-border': TX_BORDER_BROWN,
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
