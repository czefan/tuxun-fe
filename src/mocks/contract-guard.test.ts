/**
 * 契约守卫测试：以 `apifox-import.json` 为唯一裁判，校验 Mock 的每一条响应与
 * 每一次 multipart 请求。
 *
 * 与 `contract.test.ts` 的区别：那份断言的是「Mock 返回了什么」，Mock 与业务代码
 * 若出自同一份误解，断言就是循环论证；这份断言的是「Mock 与请求是否符合契约」，
 * 编造字段、写错枚举、拼错表单字段名都会在这里失败。
 */
import fs from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getActivities } from '@/features/activity/api'
import { getMyAttempts, getSolves, setSolveLike, submitAttempt } from '@/features/attempt/api'
import { deleteComment, getComments, postComment, setCommentLike } from '@/features/comment/api'
import { getContent } from '@/features/content/api'
import { submitFeedback } from '@/features/feedback/api'
import { exchangeGood, getExchanges, getGoods } from '@/features/mall/api'
import {
  getAnnouncementDetail,
  getAnnouncements,
  getInteractions,
  markAllInteractionsRead,
  markInteractionRead,
} from '@/features/notification/api'
import { createPhoto, getPhotoDetail, getPhotos, setPhotoLike } from '@/features/photo/api'
import { getMyAttemptRecords, getMyPhotoDetail, getMyPhotos } from '@/features/record/api'
import { getScoreLogs } from '@/features/score/api'
import { getUserInfo, logout, testLogin, updateNickname } from '@/features/user/api'
import { createContractValidator } from '@/mocks/contract-guard'
import { handlers } from '@/mocks/handlers'
import { server } from '@/mocks/node'
import {
  badRequest,
  conflict,
  ERROR_CODE_MATRIX,
  forbidden,
  notFound,
  operationError,
  rateLimited,
  serverError,
  unauthorized,
} from '@/mocks/response'

const SPEC_PATH = path.resolve(process.cwd(), 'contract/apifox-import.json')
const hasSpec = fs.existsSync(SPEC_PATH)

/** 收集到的契约违规，最后一次性断言，便于一眼看全 */
const violations: string[] = []

describe('契约守卫：Mock 响应与请求必须符合 apifox-import.json', () => {
  beforeAll(() => {
    expect(hasSpec, `契约文件不存在: ${SPEC_PATH}`).toBe(true)
    const spec = JSON.parse(fs.readFileSync(SPEC_PATH, 'utf-8'))
    const validator = createContractValidator(spec)

    server.events.on('request:start', async ({ request }) => {
      const contentType = request.headers.get('content-type') || ''
      if (!contentType.includes('multipart/form-data')) {
        return
      }
      const url = new URL(request.url)
      const op = validator.matchOperation(request.method, url.pathname)
      if (!op) {
        violations.push(`未能在契约中匹配到 ${request.method} ${url.pathname}`)
        return
      }
      const form = await request.clone().formData()
      // 直接展开：拿不到 keys 就应该炸，不能悄悄退化成空数组——
      // 那样这条 multipart 字段校验会永远通过，等于没有守卫。
      const error = validator.validateMultipartFields(op, [...form.keys()])
      if (error) {
        violations.push(error)
      }
    })

    server.events.on('response:mocked', async ({ request, response }) => {
      const url = new URL(request.url)
      const op = validator.matchOperation(request.method, url.pathname)
      if (!op) {
        violations.push(`未能在契约中匹配到 ${request.method} ${url.pathname}`)
        return
      }
      const body = await response.clone().json().catch(() => null)
      if (!body || typeof body !== 'object') {
        return
      }
      const error = validator.validateResponse(op, (body as { resp: unknown }).resp, response.status)
      if (error) {
        violations.push(error)
      }
    })

    server.listen({ onUnhandledRequest: 'error' })
  })

  afterAll(() => {
    server.close()
  })

  it('跑通全部客户端接口，且无任何契约违规', async () => {
    const call = async (label: string, fn: () => Promise<unknown>) => {
      try {
        // 单个调用兜底超时：条件编译分支在 vitest 下不会被剥离，
        // 个别上传路径可能走进 H5 专用实现而挂起，不应拖垮整个守卫。
        await Promise.race([
          fn(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('调用超时 3s')), 3000)),
        ])
      }
      catch (error) {
        violations.push(`${label} 调用失败: ${(error as Error).message}`)
      }
    }

    await call('user.testLogin', () => testLogin())
    await call('user.getUserInfo', () => getUserInfo())
    await call('user.updateNickname', () => updateNickname('新昵称'))
    // updateAvatar 不在此处校验：契约用 PUT multipart，而 uni.uploadFile 只能发 POST，
    // H5 走原生 XHR 兜底（需要 blob: 源，Node 环境无法构造）。属已知平台限制，
    // 见方案 §13-①「小程序端头像上传」，需后端提供 POST 或 method-override 才能闭环。
    await call('user.logout', () => logout())

    await call('activity.getActivities', () => getActivities())

    await call('photo.getPhotos', () => getPhotos())
    await call('photo.getPhotoDetail', () => getPhotoDetail(101))
    await call('photo.setPhotoLike', () => setPhotoLike(101, true))
    await call('photo.createPhoto', () => createPhoto({
      activityId: 1,
      title: '标题',
      description: '描述',
      filePath: '/tmp/a.jpg',
      latitude: 30.1,
      longitude: 120.4,
      coordType: 'gcj02',
    } as never))

    await call('attempt.submitAttempt', () => submitAttempt({
      photoId: 101,
      filePath: '/tmp/a.jpg',
      latitude: 30.1,
      longitude: 120.4,
      coordType: 'gcj02',
    }))
    await call('attempt.getSolves', () => getSolves(101))
    await call('attempt.getMyAttempts', () => getMyAttempts(101))
    await call('attempt.setSolveLike', () => setSolveLike(1, true))

    await call('comment.getComments', () => getComments(101))
    await call('comment.postComment', () => postComment(101, '评论内容'))
    await call('comment.deleteComment', () => deleteComment(1))
    await call('comment.setCommentLike', () => setCommentLike(1, true))

    await call('record.getMyPhotos', () => getMyPhotos())
    // 103 是被驳回的投稿；101 已通过，按契约该接口必须遮蔽为 404
    await call('record.getMyPhotoDetail', () => getMyPhotoDetail(103))
    await call('record.getMyAttemptRecords', () => getMyAttemptRecords())

    await call('score.getScoreLogs', () => getScoreLogs())

    await call('mall.getGoods', () => getGoods())
    await call('mall.exchangeGood', () => exchangeGood({ good_id: 1, quantity: 1 }, 'idem-key-000001'))
    await call('mall.getExchanges', () => getExchanges())

    await call('notification.getAnnouncements', () => getAnnouncements())
    await call('notification.getAnnouncementDetail', () => getAnnouncementDetail(1))
    await call('notification.getInteractions', () => getInteractions())
    await call('notification.markInteractionRead', () => markInteractionRead(1))
    await call('notification.markAllInteractionsRead', () => markAllInteractionsRead())

    await call('content.getContent', () => getContent('popup'))

    await call('feedback.submitFeedback', () => submitFeedback({
      title: '标题',
      content: '内容',
      type: 1,
      mediaFile: '/tmp/a.jpg',
    }))

    // 等待 MSW 事件回调落地
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(violations, `\n契约违规 ${violations.length} 处：\n${violations.join('\n')}\n`).toEqual([])
  })

  /**
   * 静态覆盖 1：事件校验只能看见「被调用过」的请求，
   * 契约里不存在的多余 handler（如曾出现过的 POST /auth/login）不会被触发，
   * 因此必须遍历 handler 清单做静态比对。
   */
  it('所有 MSW handler 都能在契约中找到对应 operation', () => {
    const spec = JSON.parse(fs.readFileSync(SPEC_PATH, 'utf-8'))
    const validator = createContractValidator(spec)

    const unknown = handlers
      .map((handler) => {
        const info = handler.info as { method: string, path: unknown }
        const pathname = String(info.path)
          .replace(/^\*/, '')
          .replace(/:[A-Z_]+/gi, '1')
        return { method: info.method, pathname }
      })
      .filter((item) => {
        // POST /api/user/avatar 是为了接带 X-HTTP-Method-Override: PUT 的请求（方案 §1-⑤），在 spec 中隐藏为 PUT operation
        if (item.method.toUpperCase() === 'POST' && item.pathname === '/api/user/avatar') {
          return false
        }
        return !validator.matchOperation(item.method, item.pathname)
      })
      .map(item => `${item.method} ${item.pathname}`)

    expect(unknown, `以下 Mock 路由在契约中不存在：\n${unknown.join('\n')}`).toEqual([])
  })

  /**
   * 静态覆盖 2：错误响应不经过 resp schema 校验，
   * 码位错了（如 401 返回 code=4）事件守卫看不见，只能对着码表逐条比对。
   */
  it('错误码工厂与 api.md 的码表一致', async () => {
    const factories: Record<string, () => Response> = {
      badRequest,
      serverError,
      operationError,
      notFound,
      unauthorized,
      forbidden,
      conflict,
      rateLimited,
    }

    const mismatches: string[] = []
    for (const expected of ERROR_CODE_MATRIX) {
      const response = factories[expected.name]()
      const body = await response.clone().json() as { code: number }
      if (body.code !== expected.code || response.status !== expected.status) {
        mismatches.push(
          `${expected.name}: 期望 code=${expected.code}/HTTP ${expected.status}，`
          + `实际 code=${body.code}/HTTP ${response.status}`,
        )
      }
    }

    expect(mismatches, `\n错误码错位：\n${mismatches.join('\n')}\n`).toEqual([])
  })

  /** 已通过的投稿必须被详情接口遮蔽为 404，不得用兜底数据糊弄 */
  it('gET /photos/user/{id} 对已通过投稿返回 404', async () => {
    await expect(getMyPhotoDetail(101)).rejects.toThrow()
  })
})
