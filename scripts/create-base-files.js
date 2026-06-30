import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const srcDir = path.resolve(__dirname, '../src')
const manifestPath = path.resolve(srcDir, 'manifest.json')
const pagesPath = path.resolve(srcDir, 'pages.json')
const placeholderConfigText = `${JSON.stringify({}, null, 2)}\n`

if (!fs.existsSync(srcDir)) {
  fs.mkdirSync(srcDir, { recursive: true })
}

function ensureGeneratedConfigFile(filePath) {
  if (!fs.existsSync(filePath) || fs.statSync(filePath).size <= placeholderConfigText.length) {
    fs.writeFileSync(filePath, placeholderConfigText)
  }
}

ensureGeneratedConfigFile(manifestPath)
ensureGeneratedConfigFile(pagesPath)
