import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { AppRoute } from './routes'

describe('routes', () => {
  it('appRoute 常量必须覆盖 pages.json 声明的所有页面路径', () => {
    const pagesJsonPath = path.resolve(__dirname, '../pages.json')
    const rawContent = fs.readFileSync(pagesJsonPath, 'utf-8').replace(/\/\/.*/g, '')
    const pagesJson = JSON.parse(rawContent)

    const allPages: string[] = []

    if (Array.isArray(pagesJson.pages)) {
      for (const p of pagesJson.pages) {
        if (p.path) {
          allPages.push(`/${p.path}`)
        }
      }
    }

    if (Array.isArray(pagesJson.subPackages)) {
      for (const sub of pagesJson.subPackages) {
        const root = sub.root ? sub.root.replace(/\/$/, '') : ''
        if (Array.isArray(sub.pages)) {
          for (const p of sub.pages) {
            allPages.push(`/${root}/${p.path}`)
          }
        }
      }
    }

    const appRouteValues = new Set(Object.values(AppRoute))
    const unmappedPages = allPages.filter(p => !appRouteValues.has(p as any))

    expect(unmappedPages, `以下 pages.json 页面未在 AppRoute 中定义常量：\n${unmappedPages.join('\n')}`).toEqual([])
  })

  it('页面跳转必须走 AppRoute 常量，不能硬编码路径字面量', () => {
    const PROJECT_ROOT = process.cwd()
    const SRC_ROOT = path.join(PROJECT_ROOT, 'src')

    function collectSourceFiles(dir: string, acc: string[] = []): string[] {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          collectSourceFiles(full, acc)
        }
        else if ((full.endsWith('.ts') || full.endsWith('.vue')) && !full.endsWith('schema.d.ts')) {
          acc.push(full)
        }
      }
      return acc
    }

    const violations: string[] = []
    for (const file of collectSourceFiles(SRC_ROOT)) {
      if (file.endsWith('routes.ts') || file.endsWith('.test.ts'))
        continue
      const content = fs.readFileSync(file, 'utf-8')
      const hits = content.match(/(?:uni\.(?:navigateTo|redirectTo|reLaunch|switchTab)\s*\(\s*\{[^}]*url:|navigateWithTransition\s*\()\s*[`'"]\/(?:pages|subPages)\//g)
      if (hits)
        violations.push(`${path.relative(PROJECT_ROOT, file)}（${hits.length} 处）`)
    }
    expect(violations, `以下文件硬编码了页面路径，应改用 AppRoute + withQuery：\n${violations.join('\n')}`).toEqual([])
  })
})
