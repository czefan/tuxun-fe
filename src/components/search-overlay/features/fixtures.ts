import type { SearchResult, SearchScope } from './types'
import { t } from '@/locale'

const searchPlaceholderMap: Record<SearchScope, string> = {
  home: 'search.placeholder.home',
  history: 'search.placeholder.history',
  notice: 'search.placeholder.notice',
  activity: 'search.placeholder.activity',
  mall: 'search.placeholder.mall',
  answers: 'search.placeholder.answers',
}

const searchResultMap: Record<SearchScope, SearchResult[]> = {
  home: [
    { id: 'home-1', title: '银杏大道第一枚线索', desc: '限时开放，适合新手组队打卡。', meta: '热度 2.4k' },
    { id: 'home-2', title: '镜湖边的反光坐标', desc: '需要观察水面、建筑倒影与方位。', meta: '热度 986' },
    { id: 'home-3', title: '老图书馆门前的隐藏编号', desc: '当期主线任务第 3 站。', meta: '热度 1.8k' },
  ],
  history: [
    { id: 'history-1', title: '银杏大道光影季', desc: '围绕主校区主干道与老建筑的机位解密。', meta: '2026 春季' },
    { id: 'history-2', title: '镜湖边的夏天', desc: '湖面倒影、桥边视角和傍晚光线组成的主题活动。', meta: '2025 夏季' },
    { id: 'history-3', title: '校史记忆路线', desc: '从校史广场出发，寻找校园历史线索。', meta: '2025 春季' },
  ],
  notice: [
    { id: 'notice-1', title: '本周挑战更新', desc: '本周新增 6 道校园机位题目。', meta: '6/6' },
    { id: 'notice-2', title: '系统维护提醒', desc: '本周日凌晨将进行短时维护。', meta: '6/5' },
    { id: 'notice-3', title: '评论区安全提醒', desc: '请勿在评论中泄露具体地点或答案。', meta: '5/19' },
  ],
  activity: [
    { id: 'activity-1', title: '该期主线任务', desc: '往期活动中的主线题目集合。', meta: '往期浏览' },
    { id: 'activity-2', title: '终点密码', desc: '建议两人以上协作完成。', meta: '热度 3.1k' },
    { id: 'activity-3', title: '限时光影挑战', desc: '下午 4 点后更容易找到答案。', meta: '热度 1.2k' },
  ],
  mall: [],
  answers: [
    { id: 'answers-1', title: '梧桐道第一枚线索', desc: '作答正确，已获得 10 积分。', meta: '作答正确' },
    { id: 'answers-2', title: '兴庆湖边的反光坐标', desc: '上传照片审核中，请耐心等待。', meta: '审核中' },
    { id: 'answers-3', title: '老图书馆门前的隐藏编号', desc: '作答错误，请重新拍摄并提交。', meta: '作答错误' },
  ],
}

export function getSearchPlaceholder(scope: SearchScope) {
  return t(searchPlaceholderMap[scope])
}

export function getSearchResults(scope: SearchScope, keyword: string) {
  return filterSearchResults(searchResultMap[scope], keyword)
}

export function filterSearchResults(results: SearchResult[], keyword: string) {
  const value = keyword.trim().toLowerCase()

  if (!value) {
    return []
  }

  return results.filter(item =>
    [item.title, item.desc, item.meta].some(text => text.toLowerCase().includes(value)),
  )
}
