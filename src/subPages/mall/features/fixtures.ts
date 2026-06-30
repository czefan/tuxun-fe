import type { ExchangeRecord, ProductItem } from './types'
import type { SearchResult } from '@/components/search-overlay/features'
import { mockImageAssets } from '@/mocks/assets'

export const productList: ProductItem[] = [
  {
    id: 1,
    title: '图寻钥匙扣',
    desc: '活动限定纪念周边，线下核销领取。',
    points: 2800,
    stockText: '库存 20',
    cover: mockImageAssets.brand.logo.src,
    coverWidth: mockImageAssets.brand.logo.width,
    coverHeight: mockImageAssets.brand.logo.height,
    badge: '热门',
  },
  {
    id: 2,
    title: '校园机位小卡片',
    desc: '收录活动经典机位照片与提示语。',
    points: 1200,
    stockText: '库存 45',
    cover: mockImageAssets.campus.gate.src,
    coverWidth: mockImageAssets.campus.gate.width,
    coverHeight: mockImageAssets.campus.gate.height,
  },
  {
    id: 3,
    title: '限定贴纸包',
    desc: '图寻主题贴纸，适合作为活动纪念。',
    points: 800,
    stockText: '即将开放',
    cover: mockImageAssets.campus.poster.src,
    coverWidth: mockImageAssets.campus.poster.width,
    coverHeight: mockImageAssets.campus.poster.height,
    badge: '新品',
  },
  {
    id: 4,
    title: '活动纪念徽章',
    desc: '完成指定期数后可兑换的纪念徽章。',
    points: 1800,
    stockText: '库存 12',
    cover: mockImageAssets.campus.library.src,
    coverWidth: mockImageAssets.campus.library.width,
    coverHeight: mockImageAssets.campus.library.height,
  },
]

export const mallSearchResults: SearchResult[] = [
  { id: 'mall-1', title: '图寻钥匙扣', desc: '活动限定纪念周边，线下核销领取。', meta: '2800 积分' },
  { id: 'mall-2', title: '校园机位小卡片', desc: '收录活动经典机位照片与提示语。', meta: '1200 积分' },
  { id: 'mall-3', title: '限定贴纸包', desc: '图寻主题贴纸。', meta: '800 积分' },
]

export const exchangeList: ExchangeRecord[] = [
  {
    id: 'ex-1001',
    productId: 1,
    title: '图寻钥匙扣',
    cover: mockImageAssets.brand.logo.src,
    points: 2800,
    count: 1,
    totalPoints: 2800,
    time: '2026-06-24 14:30',
    status: 'pending',
    exchangeCode: 'TX-8942-0318',
  },
  {
    id: 'ex-1002',
    productId: 2,
    title: '校园机位小卡片',
    cover: mockImageAssets.campus.gate.src,
    points: 1200,
    count: 2,
    totalPoints: 2400,
    time: '2026-06-22 09:15',
    status: 'completed',
  },
]
