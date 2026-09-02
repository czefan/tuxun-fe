#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

/**
 * 项目架构边界与依赖倒置 Lint 校验脚本。
 * 严禁：
 * 1. src/pages 和 src/subPages 越过 domain 直连 service/contract 内联手写底层模式
 * 2. src/features/ 内部跨域私有模块交叉引用
 */

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PROJECT_ROOT = path.resolve(__dirname, '..')
const SRC_DIR = path.join(PROJECT_ROOT, 'src')

const violations = []

// 规则 1: 页面不能直接引入底层 raw schema
const rawSchemaImportPattern = /import\s[^'"]*from\s+['"]@\/service\/contract\/schema['"]/
// 规则 2: 基础公共层严禁反向依赖业务域 (features)。
// 注意 src/app 不在此列——它是应用外壳，和 pages 一样属于编排层，允许依赖 features。
const sharedImportFeaturesPattern = /import\s[^'"]*from\s+['"]@\/features\//

const SHARED_DIRS = [
  'src/components',
  'src/composables',
  'src/utils',
  'src/constants',
  'src/styles',
  'src/router',
  'src/store',
]

function normalizePath(value) {
  return value.replace(/\\/g, '/')
}

function walkFiles(dir) {
  const result = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      result.push(...walkFiles(fullPath))
    } else if (entry.isFile()) {
      result.push(fullPath)
    }
  }

  return result
}

const files = walkFiles(SRC_DIR)
for (const filePath of files) {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.vue') && !filePath.endsWith('.js')) {
    continue
  }

  const fileName = path.basename(filePath)
  // 跳过自动生成的 d.ts 和 test 文件
  if (fileName.endsWith('.d.ts') || fileName.endsWith('.test.ts')) {
    continue
  }

  const relPath = normalizePath(path.relative(PROJECT_ROOT, filePath))
  const content = fs.readFileSync(filePath, 'utf-8')

  if (rawSchemaImportPattern.test(content)) {
    violations.push(`[${relPath}]: 严禁直接 import raw schema.d.ts！请通过业务域 View Model 引入。`)
  }

  if (SHARED_DIRS.some((sd) => relPath.startsWith(sd))) {
    if (sharedImportFeaturesPattern.test(content)) {
      violations.push(
        `[${relPath}]: 基础公共层严禁反向依赖业务域 (features)！应用外壳请放 src/app。`,
      )
    }
  }
}

if (violations.length > 0) {
  console.log('❌ 发现架构边界违规:')
  for (const v of violations) {
    console.log(`  - ${v}`)
  }
  process.exit(1)
} else {
  console.log('📐 架构与域边界校验通过')
  process.exit(0)
}
