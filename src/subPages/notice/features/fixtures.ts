import type { NoticeDetailContent } from './types'

const noticeDetailContentList: NoticeDetailContent[] = [
  {
    id: 9,
    content: '今日挑战已开放。请根据题目图片前往现场寻找相同机位并完成答题，完成后可获得额外活动积分。',
  },
  {
    id: 10,
    content: '昨日新增题目已完成审核，可在当期活动中查看。感谢各位同学提交校园机位题目与反馈。',
  },
  {
    id: 7,
    content:
      '本周新增 6 道校园机位题目，覆盖教学楼、湖边与运动场周边区域。完成答题后可获得活动积分，请注意不要在评论区泄露具体地点。',
  },
  {
    id: 8,
    content: '系统将在本周日凌晨进行短时维护。维护期间可能无法提交答题、发布题目或兑换奖品，浏览功能不受影响。',
  },
  {
    id: 1,
    content:
      '本期图寻已开放。请根据题目图片前往现场寻找相同机位，拍摄实时照片并提交定位完成答题。请勿在评论区泄露具体地点或答案。',
  },
  {
    id: 2,
    content: '为避免影响其他用户体验，评论区严禁发布具体地点、GPS 坐标、路线描述或直接答案。违规评论将由管理员删除。',
  },
  {
    id: 3,
    content: '积分商城将在活动结束后分批开放兑换。兑换前请确认积分余额与商品库存，线下奖品需凭核销码领取。',
  },
  {
    id: 4,
    content: '你提交的校园机位题目已通过初步审核。管理员会继续检查图片、标题和地点安全性，通过后将进入公开题库。',
  },
  {
    id: 5,
    content:
      '图寻进入试运行阶段。期间题目、答题、评论和商城功能会持续调整，如遇异常请通过个人中心反馈入口提交信息。',
  },
  {
    id: 6,
    content: '游客模式下可以正常浏览题目、往期活动、通知和商城内容，但无法执行答题、发布题目、评论、点赞和兑换奖品等交互。',
  },
]

export function getNoticeDetailContentById(id: number) {
  return noticeDetailContentList.find(item => item.id === id)?.content
}
