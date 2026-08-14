import fs from 'node:fs'
import path from 'node:path'

// 构建后守卫（挂在 postbuild:h5）：
//
// 单页模式（__UNI_FEATURE_PAGES__ = false）的产物没有页面级懒加载 chunk，
// 页面导航全部走不通，但 index.html 能正常打开、构建也不报错 —— 极难在 CI 里发现。
// 因此不能只读 src/pages.json（UniPages 在构建期间会把它重新生成成完整文件，
// 即使构建前占位符只有 1 页，构建后读到的也是多页，守卫形同虚设），
// 必须校验产物里确实存在页面级 chunk。

const pagesJsonPath = path.resolve('src/pages.json')
const assetsDir = path.resolve('dist/build/h5/assets')

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

const pageChunks = fs.existsSync(assetsDir)
  ? fs.readdirSync(assetsDir).filter(f => f.endsWith('.js') && /^(?:pages|subPages)-/.test(f))
  : []
if (pageChunks.length < 2) {
  throw new Error(`[build] H5 产物中页面级 chunk 只有 ${pageChunks.length} 个（期望 ≥2），产物是单页模式（__UNI_FEATURE_PAGES__ = false），全站导航会失效。检查 scripts/create-base-files.js 的 scanPages 与 UniPages 插件顺序。`)
}
