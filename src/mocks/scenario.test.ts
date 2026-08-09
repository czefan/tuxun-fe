import { describe, expect, it } from 'vitest'
import { db, setScenario } from './data/db'

describe('mock 数据场景与逻辑过滤测试', () => {
  it('有数据状态 (data)：数据量充足 (35+ 条)，且包含符合 API 契约限制的极限数据', () => {
    setScenario('data')
    // 验证多数据量
    expect(db.photos.length).toBeGreaterThanOrEqual(35)
    expect(db.myPhotos.length).toBeGreaterThanOrEqual(35)
    expect(db.goods.length).toBeGreaterThanOrEqual(25)
    expect(db.notifications.length).toBeGreaterThanOrEqual(12)
    expect(db.announcements.length).toBeGreaterThanOrEqual(10)

    // 验证“我的投稿”各个状态切片均包含丰富数据
    expect(db.myPhotos.filter(p => p.status === 'approved').length).toBeGreaterThan(5)
    expect(db.myPhotos.filter(p => p.status === 'pending').length).toBeGreaterThan(5)
    expect(db.myPhotos.filter(p => p.status === 'rejected').length).toBeGreaterThan(5)

    // 验证极限数据最长字数与次数在 API 契约限制范围内 (activity title<=20, activity description<=50, reject_reason<=50, nickname<=10, user_attempts_count<=5)
    expect(db.user.nickname.length).toBeLessThanOrEqual(10)
    for (const act of db.activities) {
      expect(act.title.length).toBeLessThanOrEqual(20)
      expect(act.description.length).toBeLessThanOrEqual(50)
    }
    for (const photo of db.photos) {
      expect(photo.title.length).toBeLessThanOrEqual(20)
      expect(photo.description.length).toBeLessThanOrEqual(50)
      expect(photo.user_attempts_count).toBeLessThanOrEqual(5)
    }
    for (const myPhoto of db.myPhotos) {
      expect(myPhoto.title.length).toBeLessThanOrEqual(20)
      if (myPhoto.reject_reason) {
        expect(myPhoto.reject_reason.length).toBeLessThanOrEqual(50)
      }
    }
  })

  it('无数据状态 (empty)：所有列表均为 0 条，支持 Empty 状态完整渲染', () => {
    setScenario('empty')
    expect(db.photos.length).toBe(0)
    expect(db.myPhotos.length).toBe(0)
    expect(db.goods.length).toBe(0)
    expect(db.notifications.length).toBe(0)
    expect(db.announcements.length).toBe(0)
    expect(db.comments.length).toBe(0)
    expect(db.scoreLogs.length).toBe(0)
    expect(db.user.score_count).toBe(0)
  })
})
