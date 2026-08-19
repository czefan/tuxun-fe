import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { getActivities } from '@/features/activity/api'
import { getMyAttempts, getSolves, submitAttempt } from '@/features/attempt/api'
import { getComments, postComment } from '@/features/comment/api'
import { getContent } from '@/features/content/api'
import { exchangeGood, getExchanges, getGoods } from '@/features/mall/api'
import { getAnnouncements, getInteractions } from '@/features/notification/api'
import { getPhotoDetail, getPhotos, setPhotoLike } from '@/features/photo/api'
import { getMyAttemptRecords, getMyPhotoDetail, getMyPhotos } from '@/features/record/api'
import { getScoreLogs } from '@/features/score/api'
import { getUserInfo, testLogin, updateNickname } from '@/features/user/api'
import { server } from '@/mocks/node'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('全域 API 契约真实结构与逻辑集成断言', () => {
  it('user 域: testLogin & getUserInfo & updateNickname 契约结构测试', async () => {
    const user = await testLogin('20230001')
    expect(user.id).toBeTypeOf('number')
    expect(user.netid).toBeTypeOf('string')
    // /test/login 返回 UserSummary，契约里没有 score_count，不得断言积分字段
    expect(user.isAdmin).toBe(true)

    const info = await getUserInfo()
    expect(info.points).toBe(520)

    const updateRes = await updateNickname('新极客')
    expect(updateRes.nickname).toBe('新极客')
    expect(updateRes.nicknameEditsRemaining).toBeTypeOf('number')
  })

  it('activity 域: getActivities 契约结构测试', async () => {
    const res = await getActivities()
    expect(res.total).toBeGreaterThanOrEqual(0)
    expect(res.list[0].title).toBe('校园地标探秘第一期')
  })

  it('photo 域: getPhotos & getPhotoDetail & setPhotoLike 契约结构测试', async () => {
    const res = await getPhotos({ page_size: 20 })
    expect(res.list.length).toBeGreaterThan(0)

    const detail = await getPhotoDetail(101)
    expect(detail.id).toBe(101)
    expect(detail.attemptsCount).toBeTypeOf('number')

    const likeRes = await setPhotoLike(101, true)
    expect(likeRes.liked).toBe(true)
  })

  it('attempt 域: 提交作答结果必须且只能为 pending 状态（绝不能是 solved）', async () => {
    const submitRes = await submitAttempt({
      photoId: 101,
      filePath: '/tmp/test.jpg',
      latitude: 30.123,
      longitude: 120.456,
      coordType: 'gcj02',
    })
    // 严密真契约断言：新提交作答必然为待审核状态
    expect(submitRes.status).toBe('pending')
    expect((submitRes as any).solved).toBeUndefined()
    expect((submitRes as any).points_earned).toBeUndefined()

    const solves = await getSolves(101)
    expect(solves.list.length).toBeGreaterThan(0)
    expect(solves.list.every(item => item.liked === false)).toBe(true)

    const myAttempts = await getMyAttempts(101)
    expect(myAttempts.list[0].status).toBe('pending')
  })

  it('comment 域: getComments & postComment 契约结构测试', async () => {
    const comments = await getComments(101)
    expect(comments.list.length).toBeGreaterThan(0)
    expect(comments.list.every(item => item.liked === false)).toBe(true)

    const postRes = await postComment(101, '好地标！')
    expect(postRes.status).toBe('pending')
  })

  it('record 域: getMyPhotos & getMyPhotoDetail 包含完整原图坐标', async () => {
    const myPhotos = await getMyPhotos()
    expect(myPhotos.list.length).toBeGreaterThan(0)

    const detail = await getMyPhotoDetail(103)
    expect(detail.location?.latitude).toBe(30.123)
    expect(detail.image.originUrl).toBeDefined()

    const attempts = await getMyAttemptRecords()
    expect(attempts.list[0].status).toBe('pending')
  })

  it('score 域: getScoreLogs 契约结构测试', async () => {
    const logs = await getScoreLogs()
    expect(logs.list[0].reason).toBe('answer_correct')
  })

  it('mall 域: getGoods & exchangeGood & getExchanges 契约结构测试', async () => {
    const goods = await getGoods()
    expect(goods.list[0].name).toBe('图寻限量徽章')
    expect(goods.list[0].status).toBe('in_store')

    const exchangeRes = await exchangeGood({ good_id: 1, quantity: 1 }, 'key-123')
    expect(exchangeRes.status).toBe('pending')

    const exchanges = await getExchanges()
    expect(exchanges.list[0].good.name).toBe('图寻限量徽章')
    expect(exchanges.list[0].scoreCost).toBe(100)
  })

  it('notification 域: 互动消息 relatedType 绝对只能是 photo | solve | comment（非 activity）', async () => {
    const announcements = await getAnnouncements()
    expect(announcements.list[0].title).toContain('契约升级')

    const interactions = await getInteractions()
    // 严密真契约断言：互动消息相关类型必然属于题目/解题/评论
    expect(['photo', 'solve', 'comment']).toContain(interactions.list[0].relatedType)
  })

  it('content 域: getContent 契约结构测试', async () => {
    const content = await getContent('popup')
    expect(content.key).toBe('popup')
  })
})
