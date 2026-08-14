import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const srcDir = path.resolve(__dirname, '../src')
const manifestPath = path.resolve(srcDir, 'manifest.json')
const pagesPath = path.resolve(srcDir, 'pages.json')

if (!fs.existsSync(srcDir)) {
  fs.mkdirSync(srcDir, { recursive: true })
}

function ensureGeneratedConfigFile(filePath, defaultContent = '{}\n') {
  if (!fs.existsSync(filePath) || fs.statSync(filePath).size <= defaultContent.length) {
    fs.writeFileSync(filePath, defaultContent)
  }
}

function scanPages() {
  const pages = []
  // 主包：src/pages/*/index.vue
  const mainDir = path.resolve(srcDir, 'pages')
  if (fs.existsSync(mainDir)) {
    for (const d of fs.readdirSync(mainDir, { withFileTypes: true })) {
      if (d.isDirectory() && fs.existsSync(path.join(mainDir, d.name, 'index.vue'))) {
        pages.push({ path: `pages/${d.name}/index` })
      }
    }
  }
  // 首页必须排第一位；扫不到任何页面时兜底，避免生成空数组
  pages.sort((a, b) => (a.path === 'pages/index/index' ? -1 : b.path === 'pages/index/index' ? 1 : 0))
  return pages.length ? pages : [{ path: 'pages/index/index' }]
}

const defaultManifestText = `${JSON.stringify({ name: 'tuxun', appid: '' }, null, 2)}\n`
// 占位符必须是「多页」——只写 1 页会让 @dcloudio/vite-plugin-uni 把
// __UNI_FEATURE_PAGES__ 定为 false，产物退化成单页应用，全站导航失效。
const defaultPagesText = `${JSON.stringify({ pages: scanPages() }, null, 2)}\n`

ensureGeneratedConfigFile(manifestPath, defaultManifestText)
ensureGeneratedConfigFile(pagesPath, defaultPagesText)
