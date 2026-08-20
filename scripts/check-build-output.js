import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

// 构建后守卫（挂在 postbuild:* 钩子）：
//
// 1. H5 端：单页模式（__UNI_FEATURE_PAGES__ = false）的产物没有页面级懒加载 chunk，
//    页面导航全部走不通，但 index.html 能正常打开、构建也不报错 —— 极难在 CI 里发现。
//    必须校验产物里确实存在页面级 chunk。
// 2. 小程序端：校验产物 app.json 中注册的页面总数（主包 + 分包）。

const dirArg = process.argv.find(a => a.startsWith('--dir='))
if (!dirArg) {
  throw new Error('[build] 必须通过 --dir= 指定产物目录')
}
const outDir = path.resolve(dirArg.slice('--dir='.length))

const isMp = process.argv.includes('--platform=mp')

if (isMp) {
  const appJsonPath = path.join(outDir, 'app.json')
  if (!fs.existsSync(appJsonPath)) {
    throw new Error(`[build] 未找到小程序构建产物: ${appJsonPath}`)
  }
  let appJson
  try {
    appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'))
  }
  catch (e) {
    throw new Error(`[build] 解析小程序 app.json 失败: ${e.message}`, { cause: e })
  }
  const total = (appJson.pages?.length ?? 0)
    + (appJson.subPackages ?? []).reduce((s, p) => s + (p.pages?.length ?? 0), 0)
  if (total < 2) {
    throw new Error(`[build] 小程序产物只注册了 ${total} 个页面，navigateTo 会大面积失败。检查 create-base-files 与插件顺序。`)
  }
}
else {
  const pagesJsonPath = path.resolve('src/pages.json')
  const assetsDir = path.join(outDir, 'assets')

  if (!fs.existsSync(assetsDir)) {
    throw new Error(`[build] 未找到 H5 构建产物目录: ${assetsDir}`)
  }

  const pagesJson = fs.existsSync(pagesJsonPath)
    ? (() => {
        try {
          return JSON.parse(fs.readFileSync(pagesJsonPath, 'utf8'))
        }
        catch {
          return null
        }
      })()
    : null
  const pageCount = pagesJson?.pages?.length ?? 0
  if (pageCount < 2) {
    throw new Error(`[build] pages.json 只有 ${pageCount} 个页面，产物会被编译成单页应用、全站导航失效。检查 create-base-files 与插件顺序。`)
  }

  const pageChunks = fs.readdirSync(assetsDir).filter(f => f.endsWith('.js') && /^(?:pages|subPages)-/.test(f))
  if (pageChunks.length < 2) {
    throw new Error(`[build] H5 产物中页面级 chunk 只有 ${pageChunks.length} 个（期望 ≥2），产物是单页模式（__UNI_FEATURE_PAGES__ = false），全站导航会失效。检查 scripts/create-base-files.js 的 scanPages 与 UniPages 插件顺序。`)
  }
}
