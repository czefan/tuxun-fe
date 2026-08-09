import { generateContentPreview } from './rich-text'
import { mockDiverseMedia, mockImageString, mockMedia } from './placeholder'

export type MockScenario = 'data' | 'empty' | 'default'

const ACTIVITY_1 = {
  id: 1,
  title: '校园地标探秘第一期',
  description: '探索图书馆与教学楼附近的隐藏地标',
  cover_image: mockMedia(1015, 800, 400, 'thumb'),
  photo_count: 6,
  start_time: '2026-07-01T00:00:00+08:00',
  end_time: '2026-08-31T23:59:59+08:00',
}

const ACTIVITY_2 = {
  id: 2,
  title: '旧校区历史建筑专题展',
  description: '寻找穿梭于老校区砖墙间的历史痕迹',
  cover_image: mockMedia(1040, 800, 400, 'thumb'),
  photo_count: 4,
  start_time: '2026-06-01T00:00:00+08:00',
  end_time: '2026-07-15T23:59:59+08:00',
}

const EXTREME_ACTIVITY = {
  id: 3,
  title: '老校区全域历史保护遗址深度发现极限大奖赛', // 刚好 20 字
  description: '【极限50字活动描述说明】根据校园历史文化遗产保护委员会公布的调查档案，老校区西北角望远镜塔建于民国', // 刚好 50 字
  cover_image: mockMedia(1099, 1200, 400, 'thumb'),
  photo_count: 9999,
  start_time: '2026-01-01T00:00:00+08:00',
  end_time: '2026-12-31T23:59:59+08:00',
}

let activeScenarioOverride: MockScenario | null = null

export function getActiveScenario(): MockScenario {
  if (activeScenarioOverride) {
    return activeScenarioOverride
  }
  if (typeof window !== 'undefined') {
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const urlScenario = urlParams.get('mock_scenario') as MockScenario | null
      if (urlScenario && ['data', 'empty', 'default'].includes(urlScenario)) {
        return urlScenario === 'default' ? 'data' : urlScenario
      }
      const storedScenario = window.localStorage.getItem('mock_scenario') as MockScenario | null
      if (storedScenario && ['data', 'empty', 'default'].includes(storedScenario)) {
        return storedScenario === 'default' ? 'data' : storedScenario
      }
    }
    catch {
      // 忽略非浏览器环境解析异常
    }
  }
  return 'data'
}

// 综合生成包含“多数据 + 极限边界数据”的全量有数据状态
function generateRichPhotos() {
  const list = [
    {
      id: 101,
      title: '图书馆神秘石雕',
      description: '位于图书馆东门角落的复古雕塑，阳光洒在雕刻纹理上特别有岁月沉淀感。',
      image: mockDiverseMedia(1040),
      author: { id: 1, nickname: '极客寻者', avatar: mockImageString(64, 200, 200) },
      activity: ACTIVITY_1,
      location: { latitude: 30.123, longitude: 120.456, coord_type: 'gcj02' as const },
      attempts_count: 15,
      user_attempts_count: 1,
      solved_count: 3,
      solved: false,
      likes_count: 42,
      liked: false,
      status: 'approved' as const,
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: 102,
      title: '老钟楼顶层彩绘玻璃',
      description: '需在清晨阳光穿透时才能捕捉到的绝美光影斑驳景象。',
      image: mockDiverseMedia(1062),
      author: { id: 2, nickname: '光影捕手', avatar: mockImageString(1012, 200, 200) },
      activity: ACTIVITY_2,
      location: { latitude: 30.128, longitude: 120.461, coord_type: 'gcj02' as const },
      attempts_count: 28,
      user_attempts_count: 2,
      solved_count: 8,
      solved: true,
      likes_count: 89,
      liked: true,
      status: 'approved' as const,
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    // 极限字数/数值边界项 (契约限制：title<=20字, description<=50字, nickname<=10字, user_attempts_count<=5次)
    {
      id: 901,
      title: '一二三四五六七八九十一二三四五六七八九十', // 刚好 20 字
      description: '【极限50字描述说明】根据校园历史文化遗产保护委员会2026年最新公布的调查档案物理楼天台望远镜塔。', // 刚好 50 字
      image: mockDiverseMedia(1090),
      author: { id: 99, nickname: '十位极限字符昵称', avatar: mockImageString(99, 200, 200) },
      activity: EXTREME_ACTIVITY,
      location: { latitude: 30.999999, longitude: 120.999999, coord_type: 'gcj02' as const },
      attempts_count: 99999,
      user_attempts_count: 5, // 作答上限 5 次
      solved_count: 7777,
      solved: true,
      likes_count: 999999,
      liked: true,
      status: 'approved' as const,
      created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    {
      id: 902,
      title: '🎉【极限20字】旧天文望远镜观测塔', // 字符数与 length 均 <= 20
      description: '【极限50字描述】ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijkl', // 刚好 50 字
      image: mockDiverseMedia(1091),
      author: { id: 98, nickname: '简短昵称', avatar: mockImageString(98, 200, 200) },
      activity: EXTREME_ACTIVITY,
      location: { latitude: -89.999, longitude: 179.999, coord_type: 'wgs84' as const },
      attempts_count: 0,
      user_attempts_count: 0,
      solved_count: 0,
      solved: false,
      likes_count: 0,
      liked: false,
      status: 'approved' as const,
      created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
    },
  ]

  // 追加多页分页测试数据 (累计 35+ 条，全部绑定进行中活动，避免首页过滤掉)
  for (let i = 105; i <= 140; i++) {
    const isOdd = i % 2 !== 0
    list.push({
      id: i,
      title: `地标记录 #${i}`,
      description: `这是用于测试无限滚动和分页加载的第 ${i} 条模拟地标题目。`,
      image: mockDiverseMedia(1000 + i),
      author: { id: (i % 5) + 1, nickname: `玩家_${i % 100}`, avatar: mockImageString(1000 + i, 200, 200) },
      activity: isOdd ? ACTIVITY_1 : EXTREME_ACTIVITY,
      location: { latitude: 30.120 + (i * 0.001), longitude: 120.450 + (i * 0.001), coord_type: 'gcj02' as const },
      attempts_count: i * 3,
      user_attempts_count: (i % 5) + 1, // 保证 <= 5
      solved_count: Math.floor(i / 2),
      solved: i % 2 === 0,
      likes_count: i * 7,
      liked: i % 3 === 0,
      status: 'approved' as const,
      created_at: new Date(Date.now() - i * 3600000).toISOString(),
    })
  }
  return list
}

function generateRichMyPhotos() {
  const list = [
    // 已通过基础及极限项
    {
      id: 108,
      title: '物理楼天台旧天文望远镜观测塔',
      description: '只有极少数学生探访过的暗夜观测据点。',
      image: mockMedia(1059, 800, 600),
      location: { latitude: 30.126, longitude: 120.457, coord_type: 'gcj02' as const },
      activity: ACTIVITY_2,
      status: 'approved' as const,
      reject_reason: null,
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    // 未通过（已驳回）包含极限 50 字驳回理由
    {
      id: 103,
      title: '地下防空洞铁门遗址探秘20字长标题极限项', // 20 字
      description: '位于旧图书馆地下室通往第二教学楼之间的地下通道。',
      image: mockMedia(1040, 800, 600),
      location: { latitude: 30.123, longitude: 120.456, coord_type: 'gcj02' as const },
      activity: ACTIVITY_1,
      status: 'rejected' as const,
      reject_reason: '【极限50字驳回原因】经审核复核，画面偏色光线不足且关键铭牌隐没在阴影中无法辨认，定位偏差大于50米',
      created_at: new Date(Date.now() - 35 * 86400000).toISOString(),
    },
    // 审核中
    {
      id: 104,
      title: '计算机系馆旧显微镜展示柜',
      description: '系馆一楼走廊角落的展柜。',
      image: mockMedia(1050, 800, 600),
      location: { latitude: 30.125, longitude: 120.458, coord_type: 'gcj02' as const },
      activity: ACTIVITY_1,
      status: 'pending' as const,
      reject_reason: null,
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ]

  // 补充 35+ 条投稿数据，确保“全部”、“审核中”、“已通过”、“未通过”每个 Tab 分页均有充足数据
  const statuses: Array<'approved' | 'pending' | 'rejected'> = ['approved', 'pending', 'rejected']
  for (let i = 1; i <= 36; i++) {
    const st = statuses[i % 3]
    const base = {
      id: 200 + i,
      title: `我的投稿记录 #${i} (${st === 'approved' ? '已通过' : st === 'pending' ? '审核中' : '未通过'})`,
      description: `第 ${i} 条投稿的详细描述，包含地理坐标定位与现场拍摄说明。`,
      image: mockDiverseMedia(1020 + i),
      location: { latitude: 30.12 + i * 0.001, longitude: 120.45 + i * 0.001, coord_type: 'gcj02' as const },
      activity: i % 2 === 0 ? ACTIVITY_1 : ACTIVITY_2,
      created_at: new Date(Date.now() - i * 7200000).toISOString(),
    }
    // 按状态收窄为单一字面量，保证与 list 的判别联合类型兼容
    if (st === 'approved' || st === 'pending') {
      list.push({ ...base, status: st, reject_reason: null })
    }
    else {
      list.push({ ...base, status: 'rejected', reject_reason: `驳回原因通知 #${i}：照片主体遮挡严重，定位偏差大于 50 米，请重新在阳光充足时拍摄。` })
    }
  }
  return list
}

class MockDatabase {
  scenario: MockScenario = 'data'

  user = {
    id: 1,
    netid: '20260001',
    username: '测试管理员',
    nickname: '极客寻者',
    avatar: mockImageString(64, 200, 200),
    score_count: 520,
    level: 2 as const,
    status: 'active' as const,
    nickname_edits_remaining: 3,
    avatar_edits_remaining: 3,
  }

  activities = [ACTIVITY_1, ACTIVITY_2, EXTREME_ACTIVITY]

  photos: any[] = []
  myPhotos: any[] = []
  goods: any[] = []
  announcements: any[] = []
  notifications: any[] = []
  comments: any[] = []
  solves: any[] = []
  attempts: any[] = []
  scoreLogs: any[] = []
  exchanges: any[] = []
  contents = {} as Record<string, { key: string, content: string, related_id: number | null, version: number, updated_at: string }>

  meta = {
    nextPhotoId: 1000,
    nextFeedbackId: 601,
    nextExchangeId: 800,
    nextAttemptId: 3000,
    nextCommentId: 10000,
    nextVerifyCodeSeed: 1,
    defaultAvatarUrl: mockImageString(100, 200, 200),
  }

  constructor() {
    this.resetData()
  }

  resetData() {
    this.scenario = getActiveScenario()

    if (this.scenario === 'empty') {
      this.user.score_count = 0
      this.user.nickname_edits_remaining = 0
      this.user.avatar_edits_remaining = 0
      this.activities = []
      this.photos = []
      this.myPhotos = []
      this.goods = []
      this.announcements = []
      this.notifications = []
      this.comments = []
      this.solves = []
      this.attempts = []
      this.scoreLogs = []
      this.exchanges = []
      this.contents = {
        popup: { key: 'popup', content: '<p>暂无弹窗通知</p>', related_id: null, version: 1, updated_at: '2026-07-31T00:00:00+08:00' },
        help: { key: 'help', content: '<p>暂无帮助文档</p>', related_id: null, version: 1, updated_at: '2026-07-31T00:00:00+08:00' },
        score_rules: { key: 'score_rules', content: '<p>暂无规则文档</p>', related_id: null, version: 1, updated_at: '2026-07-31T00:00:00+08:00' },
      }
      return
    }

    // 有数据状态 (包含多数据与极限数据)
    this.user.score_count = 520
    this.user.nickname_edits_remaining = 3
    this.user.avatar_edits_remaining = 3
    this.user.nickname = '极客寻者'
    this.activities = [ACTIVITY_1, ACTIVITY_2, EXTREME_ACTIVITY]
    this.photos = generateRichPhotos()
    this.myPhotos = generateRichMyPhotos()
    this.goods = [
      {
        id: 1,
        name: '图寻限量徽章',
        description: '精美金属烤漆工艺纪念徽章',
        image: mockMedia(1060, 400, 400),
        score_price: 100,
        stock: 50,
        status: 'in_store' as const,
        created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
      },
      {
        id: 2,
        name: '极客帆布袋 (已售罄缺货边界测试)',
        description: '100% 纯棉加厚环保帆布袋',
        image: mockMedia(1070, 400, 400),
        score_price: 300,
        stock: 0,
        status: 'out_store' as const,
        created_at: new Date(Date.now() - 35 * 86400000).toISOString(),
      },
      ...Array.from({ length: 23 }, (_, i) => ({
        id: i + 3,
        name: `商城积分测试商品 #${i + 3}`,
        description: `包含商品规格细节与兑换流程说明的商品 #${i + 3}。`,
        image: mockMedia(1060 + (i % 20), 400, 400),
        score_price: (i + 1) * 50,
        stock: 50,
        status: 'in_store' as const,
        created_at: new Date(Date.now() - (i + 2) * 86400000).toISOString(),
      })),
    ]
    this.announcements = [
      {
        id: 301,
        title: '图寻前端契约升级公告',
        content: '全面重构接口契约与域驱动架构，提升跨端兼容性与离线状态恢复体验。',
        get content_preview() {
          return generateContentPreview(this.content)
        },
        image: mockMedia(1080, 800, 450),
        related_type: 'activity' as const,
        related_id: 1,
        is_read: false,
        created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      },
      {
        id: 302,
        title: '关于防范暑期作弊与虚拟定位的通知',
        content: '请广大探秘者遵守真实探秘规则，系统已引入精确定位比对校验算法。',
        get content_preview() {
          return generateContentPreview(this.content)
        },
        image: null,
        related_type: null,
        related_id: null,
        is_read: true,
        created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
      ...Array.from({ length: 10 }, (_, i) => ({
        id: 303 + i,
        title: `系统多数据公告通知 #${i + 3} - 规则与活动更新说明`,
        content: `这是第 ${i + 3} 条系统通知的详细文字说明内容。`,
        get content_preview() {
          return generateContentPreview(this.content)
        },
        image: i % 2 === 0 ? mockMedia(1080 + i, 800, 450) : null,
        related_type: i % 2 === 0 ? ('activity' as const) : null,
        related_id: i % 2 === 0 ? 1 : null,
        is_read: i > 5,
        // 日期按 本周 / 本月 / 更早 三档分布，以当前时间为基准生成；
        // 最后两档（365 / 400 天前）落在去年，用于验证“今年不显示年份、往年显示年份”的展示规则
        created_at: new Date(Date.now() - [2, 4, 6, 9, 13, 18, 30, 45, 365, 400][i] * 86400000).toISOString(),
      })),
    ]
    this.notifications = [
      {
        id: 201,
        type: 'like' as const,
        user: { id: 5, nickname: '小红', avatar: mockImageString(1027, 200, 200) },
        related_type: 'photo' as const,
        related_id: 101,
        photo_id: 101,
        content: '赞了你的地标题目《图书馆神秘石雕》',
        is_read: false,
        created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      },
      ...Array.from({ length: 13 }, (_, i) => ({
        id: 202 + i,
        type: i % 2 === 0 ? ('like' as const) : ('comment' as const),
        user: { id: i + 1, nickname: `互动用户_${i + 1}`, avatar: mockImageString(1000 + i, 200, 200) },
        related_type: 'photo' as const,
        related_id: 101,
        photo_id: 101,
        content: i % 2 === 0 ? `赞了你的地标题目` : `评论了你的题目："太精彩的线索！"`,
        is_read: i > 5,
        // 日期按 本周 / 本月 / 更早 三档分布，以当前时间为基准生成；
        // 最后两档（365 / 400 天前）落在去年，用于验证“今年不显示年份、往年显示年份”的展示规则
        created_at: new Date(Date.now() - [0, 0, 0, 0, 4, 6, 9, 14, 20, 35, 50, 365, 400][i] * 86400000 - (i % 4) * 3600000).toISOString(),
      })),
    ]
    this.comments = [
      {
        id: 1,
        photo_id: 101,
        author: { id: 4, nickname: '路人甲', avatar: mockImageString(1027, 200, 200) },
        content: '这里的石雕角落太隐蔽了！清晨光线最好。',
        liked: false,
        likes_count: 5,
        created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      },
      ...Array.from({ length: 19 }, (_, i) => ({
        id: 500 + i,
        photo_id: 101,
        author: { id: i + 1, nickname: `评论者_${i + 1}`, avatar: mockImageString(1000 + i, 200, 200) },
        content: `这是在题目 #101 下发布的第 ${i + 1} 条评论讨论内容 (契约 140 字限制内)。`,
        liked: i % 2 === 0,
        likes_count: i * 3,
        created_at: new Date(Date.now() - i * 1800000).toISOString(),
      })),
    ]
    this.solves = [
      {
        id: 1,
        photo_id: 101,
        author: { id: 3, nickname: '破解大神', avatar: mockImageString(1025, 200, 200) },
        image: mockMedia(1062, 600, 800),
        likes_count: 10,
        liked: false,
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      ...Array.from({ length: 14 }, (_, i) => ({
        id: 100 + i,
        photo_id: 101,
        author: { id: i + 1, nickname: `破解达人_${i + 1}`, avatar: mockImageString(1000 + i, 200, 200) },
        image: mockDiverseMedia(1060 + i),
        likes_count: i * 5,
        liked: i % 2 === 0,
        created_at: new Date(Date.now() - i * 3600000).toISOString(),
      })),
    ]
    this.attempts = [
      {
        id: 999,
        photo_id: 101,
        user_attempts_count: 1,
        image: mockMedia(1062, 600, 800),
        location: { longitude: 120.456, latitude: 30.123, coord_type: 'gcj02' as const },
        status: 'pending' as const,
        reject_reason: null,
        created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
        photo: {
          id: 101,
          title: '图书馆神秘石雕',
          image: mockMedia(1040, 800, 600),
        },
      },
      ...Array.from({ length: 24 }, (_, i) => ({
        id: 900 + i,
        photo_id: 101,
        user_attempts_count: (i % 5) + 1,
        image: mockDiverseMedia(1060 + i),
        location: { longitude: 120.456, latitude: 30.123, coord_type: 'gcj02' as const },
        status: i % 3 === 0 ? ('pending' as const) : (i % 2 === 0 ? ('solved' as const) : ('unsolved' as const)),
        reject_reason: i % 2 !== 0 && i % 3 !== 0 ? '定位偏差超出阈值' : null,
        created_at: new Date(Date.now() - i * 7200000).toISOString(),
        photo: {
          id: 101,
          title: '图书馆神秘石雕',
          image: mockMedia(1040, 800, 600),
        },
      })),
    ]
    this.scoreLogs = [
      {
        id: 1,
        delta: 50,
        balance: 88888,
        reason: 'answer_correct' as const,
        related_id: 101,
        related_type: 'photo' as const,
        related_title: '图书馆神秘石雕',
        created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      ...Array.from({ length: 24 }, (_, i) => ({
        id: i + 2,
        delta: i % 2 === 0 ? 50 : -30,
        balance: 88888 - i * 20,
        reason: i % 2 === 0 ? ('answer_correct' as const) : ('exchange' as const),
        related_id: i % 2 === 0 ? 101 : i + 1,
        related_type: i % 2 === 0 ? ('photo' as const) : ('exchange' as const),
        related_title: i % 2 === 0 ? `题目探秘日志 #${i + 2}` : `精美奖品兑换 #${i + 2}`,
        created_at: new Date(Date.now() - i * 86400000).toISOString(),
      })),
    ]
    this.exchanges = [
      {
        id: 701,
        good: {
          id: 1,
          name: '图寻限量徽章',
          image: mockMedia(1060, 400, 400),
          score_price: 100,
        },
        quantity: 1,
        score_cost: 100,
        status: 'pending' as const,
        verify_code: 'VX78A9B2',
        exchange_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      ...Array.from({ length: 14 }, (_, i) => ({
        id: 702 + i,
        good: {
          id: 1,
          name: `图寻兑换商品 #${i + 2}`,
          image: mockMedia(1060, 400, 400),
          score_price: 100,
        },
        quantity: 1,
        score_cost: 100,
        status: i % 2 === 0 ? ('pending' as const) : ('verified' as const),
        verify_code: `TX${String(i + 2).padStart(6, '0')}`,
        exchange_at: new Date(Date.now() - i * 86400000).toISOString(),
        created_at: new Date(Date.now() - i * 86400000).toISOString(),
      })),
    ]
    this.contents = {
      popup: {
        key: 'popup',
        content: '<h3>🎉 图寻契约升级完成！</h3><p>欢迎体验全新域驱动与智能压缩架构！</p>',
        related_id: null,
        version: 1,
        updated_at: '2026-07-31T00:00:00+08:00',
      },
      help: {
        key: 'help',
        content: '<h3>帮助中心</h3><p>1. <b>如何投稿地标？</b> 点击底栏“投稿”，选图后系统会自动二分逼近智能压缩（≤20MB 原图保持，>20MB 逼近至 19MB 以内），并上传真实经纬度坐标。<br/>2. <b>破解规则：</b> 前往目标现场后拍摄对比照片，在指定距离误差内比对线索通过审核即可获得积分。<br/>3. <b>修改次数限制：</b> 每位探秘者当月可修改昵称 4 次，修改头像 10 次。</p>',
        related_id: null,
        version: 1,
        updated_at: '2026-07-31T00:00:00+08:00',
      },
      score_rules: {
        key: 'score_rules',
        content: '<h3>积分获得与扣减规则</h3><p>• <b>正确破解地标：</b> 审核通过后一次性获得 +50 积分奖励。<br/>• <b>投稿通过审定：</b> 成功上传优质地标题目获得 +100 积分奖励。<br/>• <b>积分商城兑换：</b> 依照商品定价扣除相应积分，需携带防重 Idempotency-Key。<br/>• <b>违规扣减：</b> 违规提交虚假坐标将被扣除 -20 至 -100 积分。</p>',
        related_id: null,
        version: 1,
        updated_at: '2026-07-31T00:00:00+08:00',
      },
    }
  }

  getCommentsByPhotoId(photoId: number) {
    if (this.scenario === 'empty')
      return []
    let list = this.comments.filter(c => c.photo_id === photoId)
    if (list.length === 0) {
      const count = 3 + (photoId % 5)
      for (let i = 1; i <= count; i++) {
        const id = this.meta.nextCommentId++
        const record = {
          id,
          photo_id: photoId,
          author: { id: (i % 6) + 1, nickname: `探秘者_${i}`, avatar: mockImageString(1000 + i, 200, 200) },
          content: `这是在题目 #${photoId} 下发布的第 ${i} 条线索讨论评论。`,
          liked: i % 2 === 0,
          likes_count: i * 3,
          created_at: new Date(Date.now() - i * 3600000).toISOString(),
        }
        this.comments.push(record)
      }
      list = this.comments.filter(c => c.photo_id === photoId)
    }
    return list
  }

  getSolvesByPhotoId(photoId: number) {
    if (this.scenario === 'empty')
      return []
    let list = this.solves.filter(s => s.photo_id === photoId)
    if (list.length === 0) {
      const count = 2 + (photoId % 4)
      for (let i = 1; i <= count; i++) {
        const id = 1000 + this.solves.length + i
        const record = {
          id,
          photo_id: photoId,
          author: { id: (i % 6) + 1, nickname: `破解达人_${i}`, avatar: mockImageString(1000 + i, 200, 200) },
          image: mockMedia(1060 + i, 600, 800),
          likes_count: i * 4,
          liked: i % 2 === 0,
          created_at: new Date(Date.now() - i * 7200000).toISOString(),
        }
        this.solves.push(record)
      }
      list = this.solves.filter(s => s.photo_id === photoId)
    }
    return list
  }

  getAttemptsByPhotoId(photoId: number) {
    if (this.scenario === 'empty')
      return []
    let list = this.attempts.filter(a => a.photo_id === photoId)
    if (list.length === 0) {
      const photo = this.photos.find(p => p.id === photoId) || { id: photoId, title: `题目 #${photoId}`, image: mockMedia(1040, 800, 600) }
      const count = 1 + (photoId % 3)
      for (let i = 1; i <= count; i++) {
        const id = 2000 + this.attempts.length + i
        const record = {
          id,
          photo_id: photoId,
          user_attempts_count: i,
          image: mockMedia(1060 + i, 600, 800),
          location: { longitude: 120.456 + i * 0.001, latitude: 30.123 + i * 0.001, coord_type: 'gcj02' as const },
          status: i % 2 === 0 ? ('solved' as const) : ('unsolved' as const),
          reject_reason: i % 2 !== 0 ? '定位偏差超出阈值' : null,
          created_at: new Date(Date.now() - i * 14400000).toISOString(),
          photo: {
            id: photo.id,
            title: photo.title,
            image: photo.image,
          },
        }
        this.attempts.push(record)
      }
      list = this.attempts.filter(a => a.photo_id === photoId)
    }
    return list
  }

  createExchange(goodId: number) {
    const good = this.goods.find(g => g.id === goodId) || this.goods[0]
    const id = this.meta.nextExchangeId++
    const verifyCode = `TX${String(this.meta.nextVerifyCodeSeed++).padStart(6, '0')}`
    const record = {
      id,
      good: {
        id: good?.id || goodId,
        name: good?.name || '兑换商品',
        image: good?.image || mockMedia(1060, 400, 400),
        score_price: good?.score_price || 100,
      },
      quantity: 1,
      score_cost: good?.score_price || 100,
      status: 'pending' as const,
      verify_code: verifyCode,
      exchange_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }
    this.exchanges.unshift(record)
    return { id, status: 'pending' as const, verify_code: verifyCode }
  }

  createAttempt(photoId: number) {
    const id = this.meta.nextAttemptId++
    const photo = this.photos.find(p => p.id === photoId) || this.photos[0]
    const record = {
      id,
      photo_id: photoId,
      user_attempts_count: 1,
      image: photo?.image || mockMedia(1040, 800, 600),
      location: { longitude: 120.456, latitude: 30.123, coord_type: 'gcj02' as const },
      status: 'pending' as const,
      reject_reason: null,
      created_at: new Date().toISOString(),
      photo: {
        id: photo?.id || photoId,
        title: photo?.title || '地标探秘',
        image: photo?.image || mockMedia(1040, 800, 600),
      },
    }
    this.attempts.unshift(record)
    return { id, status: 'pending' as const }
  }

  createComment(photoId: number, content: string) {
    const id = this.meta.nextCommentId++
    const record = {
      id,
      photo_id: photoId,
      author: { id: this.user.id, nickname: this.user.nickname, avatar: this.user.avatar },
      content,
      liked: false,
      likes_count: 0,
      created_at: new Date().toISOString(),
    }
    this.comments.unshift(record)
    return { id, status: 'pending' as const }
  }

  createPhoto(title: string, description: string) {
    const id = this.meta.nextPhotoId++
    const record = {
      id,
      title,
      description,
      image: mockMedia(1040, 800, 600),
      location: { latitude: 30.123, longitude: 120.456, coord_type: 'gcj02' as const },
      activity: ACTIVITY_1,
      status: 'pending' as const,
      reject_reason: null,
      created_at: new Date().toISOString(),
    }
    this.myPhotos.unshift(record)
    return { id, status: 'pending' as const }
  }

  createFeedback() {
    const id = this.meta.nextFeedbackId++
    return { id, status: 'pending' as const }
  }
}

export const db = new MockDatabase()

export function setScenario(scenario: MockScenario) {
  activeScenarioOverride = scenario === 'default' ? 'data' : scenario
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem('mock_scenario', scenario)
    }
    catch {
      // ignore
    }
  }
  db.resetData()
}
