import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import type { Plugin } from 'vite'

type PagesJsonItem = Record<string, unknown>

interface GeneratedPagesJson {
  pages?: PagesJsonItem[]
  subPackages?: Array<PagesJsonItem & { pages?: PagesJsonItem[] }>
  tabBar?: PagesJsonItem & { list?: PagesJsonItem[] }
  [key: string]: unknown
}

function dedupeByKey<T extends PagesJsonItem>(items: T[] | undefined, key: string) {
  if (!Array.isArray(items)) {
    return items
  }

  const result: T[] = []
  const indexByKey = new Map<string, number>()

  for (const item of items) {
    const value = item[key]

    if (typeof value !== 'string') {
      result.push(item)
      continue
    }

    const existingIndex = indexByKey.get(value)
    if (existingIndex === undefined) {
      indexByKey.set(value, result.length)
      result.push(item)
    }
    else {
      result[existingIndex] = item
    }
  }

  return result
}

export function normalizeGeneratedPagesJson(rootDir: string) {
  const pagesJsonPath = path.resolve(rootDir, 'src/pages.json')

  if (!fs.existsSync(pagesJsonPath)) {
    return
  }

  const source = fs.readFileSync(pagesJsonPath, 'utf-8')
  const withoutLineComments = source.replace(/^\s*\/\/.*$/gm, '')
  let pagesJson: GeneratedPagesJson

  try {
    pagesJson = JSON.parse(withoutLineComments)
  }
  catch {
    return
  }

  pagesJson.pages = dedupeByKey(pagesJson.pages, 'path')
  pagesJson.subPackages = pagesJson.subPackages?.map(subPackage => ({
    ...subPackage,
    pages: dedupeByKey(subPackage.pages, 'path'),
  }))

  if (pagesJson.tabBar) {
    pagesJson.tabBar = {
      ...pagesJson.tabBar,
      list: dedupeByKey(pagesJson.tabBar.list, 'pagePath'),
    }
  }

  const normalized = `${JSON.stringify(pagesJson, null, 2)}\n`

  if (source !== normalized) {
    fs.writeFileSync(pagesJsonPath, normalized)
  }
}

export function normalizePagesJsonPlugin(): Plugin {
  return {
    name: 'normalize-pages-json',
    configResolved(config) {
      normalizeGeneratedPagesJson(config.root)
    },
    buildStart() {
      normalizeGeneratedPagesJson(process.cwd())
    },
  }
}
