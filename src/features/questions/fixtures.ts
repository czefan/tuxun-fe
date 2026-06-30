import { mockImageAssets, mockQuestionImages } from '@/mocks/assets'
import type { AnswerRecord, MyAnswerRecord, QuestionCard } from './types'

export const questionList: QuestionCard[] = [
  {
    id: 1,
    title: '在银杏大道尽头找到今天的第一枚线索',
    cover: mockQuestionImages[0].src,
    coverWidth: mockQuestionImages[0].width,
    coverHeight: mockQuestionImages[0].height,
    avatar: '寻',
    author: '图寻小队',
    heat: '9462',
    heatValue: 2400,
    createdAt: 20260606,
    body: '这张图的机位在主路尽头附近，需要同时观察树影、道路方向和远处建筑轮廓。',
    location: '主校区',
  },
  {
    id: 2,
    title: '镜湖边的反光坐标',
    cover: mockQuestionImages[1].src,
    coverWidth: mockQuestionImages[1].width,
    coverHeight: mockQuestionImages[1].height,
    avatar: '湖',
    author: '校史广场',
    heat: '986',
    heatValue: 986,
    createdAt: 20260605,
    body: '线索藏在水面倒影里，建议傍晚沿湖边慢慢找，注意不要只看建筑本体。',
    location: '镜湖',
  },
  {
    id: 3,
    title: '老图书馆门前的隐藏编号，无法生 yu，但本人巨漂亮',
    cover: mockQuestionImages[2].src,
    coverWidth: mockQuestionImages[2].width,
    coverHeight: mockQuestionImages[2].height,
    avatar: '书',
    author: '图书馆线索Redamancy',
    heat: '2',
    heatValue: 1800,
    createdAt: 20260604,
    body: '编号不在最显眼的位置，靠近台阶后从侧面观察更容易发现。',
    location: '老图书馆',
  },
  {
    id: 4,
    title: '教学楼光影挑战',
    cover: mockQuestionImages[3].src,
    coverWidth: mockQuestionImages[3].width,
    coverHeight: mockQuestionImages[3].height,
    avatar: '光',
    author: 'Beaglegogogo',
    heat: '2.2万',
    heatValue: 1200,
    createdAt: 20260603,
    body: '下午四点以后光线角度更接近原图，阴影位置是判断机位的关键。',
    location: '教学楼',
  },
  {
    id: 5,
    title: '食堂门口的彩蛋提示',
    cover: mockQuestionImages[4].src,
    coverWidth: mockQuestionImages[4].width,
    coverHeight: mockQuestionImages[4].height,
    avatar: '彩',
    author: '活动运营组',
    heat: '742',
    heatValue: 742,
    createdAt: 20260602,
    overlayText: '完成后可解锁额外积分',
    body: '这是一道彩蛋题，线索来自食堂门口的公告栏和地面标识。',
    location: '食堂门口',
  },
  {
    id: 6,
    title: '操场看台的终点密码',
    cover: mockQuestionImages[0].src,
    coverWidth: mockQuestionImages[0].width,
    coverHeight: mockQuestionImages[0].height,
    avatar: '终',
    author: '图寻',
    heat: '3.1k',
    heatValue: 3100,
    createdAt: 20260601,
    body: '终点密码需要结合看台编号和题目图片里的视角，不建议单人硬猜。',
    location: '操场看台',
  },
]

export function getQuestionById(id: number) {
  return questionList.find(item => item.id === id) ?? questionList[0]
}

export const myAnswerRecordLimit = 10

export function getQuestionAnswerRecords(
  questionId: number,
  questionCover: string,
  questionCoverWidth: number,
  questionCoverHeight: number,
): AnswerRecord[] {
  return [
    {
      id: questionId * 100 + 1,
      userName: '我',
      avatar: '我',
      image: questionCover,
      imageWidth: questionCoverWidth,
      imageHeight: questionCoverHeight,
      answeredAt: '今天 12:24',
      likes: 128,
    },
    {
      id: questionId * 100 + 2,
      userName: 'Beaglegogogo',
      avatar: 'B',
      image: mockImageAssets.campus.building.src,
      imageWidth: mockImageAssets.campus.building.width,
      imageHeight: mockImageAssets.campus.building.height,
      answeredAt: '昨天 18:06',
      likes: 76,
    },
    {
      id: questionId * 100 + 3,
      userName: '图寻小队',
      avatar: '寻',
      image: questionCover,
      imageWidth: questionCoverWidth,
      imageHeight: questionCoverHeight,
      answeredAt: '6/6 09:41',
      likes: 42,
    },
  ]
}

export function getMyQuestionAnswerRecords(
  questionId: number,
  questionCover: string,
  questionCoverWidth: number,
  questionCoverHeight: number,
): MyAnswerRecord[] {
  return [
    {
      id: questionId * 1000 + 1,
      status: 'pending',
      image: questionCover,
      imageWidth: questionCoverWidth,
      imageHeight: questionCoverHeight,
      answeredAt: '今天 12:40',
    },
    {
      id: questionId * 1000 + 2,
      status: 'wrong',
      image: mockImageAssets.campus.poster.src,
      imageWidth: mockImageAssets.campus.poster.width,
      imageHeight: mockImageAssets.campus.poster.height,
      answeredAt: '昨天 18:12',
    },
    {
      id: questionId * 1000 + 3,
      status: 'correct',
      image: questionCover,
      imageWidth: questionCoverWidth,
      imageHeight: questionCoverHeight,
      answeredAt: '6/6 09:45',
      likes: 18,
    },
  ]
}
