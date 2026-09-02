#!/usr/bin/env node
/**
 * 前端契约校验脚本 (check:contract)
 *
 * 校验内容：
 * 1. JSON 格式与 OpenAPI 3.0 基础结构校验
 * 2. 全量路由 operationId 唯一性与非空校验
 * 3. 全量 $ref 内部引用解析校验（防止悬空引用）
 * 4. 与 contract/api.md 接口清单的双向一致性比对校验
 */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const FE_ROOT = path.resolve(__dirname, '..')

// 1. 确定输入文件路径
const schemaEnv = process.env.OPENAPI_SCHEMA_PATH
let jsonPath
let mdPath

if (schemaEnv) {
  jsonPath = path.resolve(schemaEnv)
  mdPath = path.join(path.dirname(jsonPath), 'api.md')
} else {
  jsonPath = path.join(FE_ROOT, 'contract', 'apifox-import.json')
  mdPath = path.join(FE_ROOT, 'contract', 'api.md')
}

if (!fs.existsSync(jsonPath)) {
  console.log(`❌ 错误: 契约文件不存在 (${jsonPath})`)
  process.exit(1)
}

// 2. JSON 格式与 OpenAPI 基础结构
let spec
try {
  const content = fs.readFileSync(jsonPath, 'utf-8')
  spec = JSON.parse(content)
} catch (e) {
  console.log(`❌ 契约 JSON 解析失败: ${e.message || e}`)
  process.exit(1)
}

if (
  !spec ||
  typeof spec !== 'object' ||
  Array.isArray(spec) ||
  !('openapi' in spec) ||
  !('paths' in spec)
) {
  console.log('❌ 契约格式错误: 缺少 openapi 或 paths 根属性')
  process.exit(1)
}

const errors = []

// 3. operationId 唯一性与非空校验
const HTTP_METHODS = new Set(['get', 'post', 'put', 'delete', 'patch', 'options', 'head'])
const operationIds = {}
const specEndpoints = new Set()

const paths = spec.paths && typeof spec.paths === 'object' ? spec.paths : {}
for (const [routePath, pathItem] of Object.entries(paths)) {
  if (!pathItem || typeof pathItem !== 'object' || Array.isArray(pathItem)) {
    continue
  }
  for (const [method, op] of Object.entries(pathItem)) {
    if (HTTP_METHODS.has(method.toLowerCase())) {
      const methodUpper = method.toUpperCase()
      specEndpoints.add(`${methodUpper} ${routePath}`)
      if (!op || typeof op !== 'object' || Array.isArray(op)) {
        errors.push(`${methodUpper} ${routePath}: operation 定义非法`)
        continue
      }
      const opId = op.operationId
      if (!opId) {
        errors.push(`${methodUpper} ${routePath}: 缺少 operationId`)
      } else if (opId in operationIds) {
        errors.push(
          `${methodUpper} ${routePath}: operationId '${opId}' 与 ${operationIds[opId]} 重复`,
        )
      } else {
        operationIds[opId] = `${methodUpper} ${routePath}`
      }
    }
  }
}

// 4. $ref 引用解析校验
function resolveRef(refStr, doc) {
  if (!refStr.startsWith('#/')) {
    return true
  }
  const parts = refStr.slice(2).split('/')
  let curr = doc
  for (let p of parts) {
    p = p.replace(/~1/g, '/').replace(/~0/g, '~')
    if (
      curr &&
      typeof curr === 'object' &&
      !Array.isArray(curr) &&
      Object.prototype.hasOwnProperty.call(curr, p)
    ) {
      curr = curr[p]
    } else if (Array.isArray(curr) && /^\d+$/.test(p) && Number(p) < curr.length) {
      curr = curr[Number(p)]
    } else {
      return false
    }
  }
  return true
}

function checkAllRefs(node, nodePath = '') {
  if (node && typeof node === 'object') {
    if (Array.isArray(node)) {
      for (let idx = 0; idx < node.length; idx++) {
        checkAllRefs(node[idx], `${nodePath}[${idx}]`)
      }
    } else {
      for (const [k, v] of Object.entries(node)) {
        if (k === '$ref' && typeof v === 'string') {
          if (!resolveRef(v, spec)) {
            errors.push(`悬空 $ref 引用: ${nodePath}/$ref -> '${v}'`)
          }
        } else {
          checkAllRefs(v, `${nodePath}/${k}`)
        }
      }
    }
  }
}

checkAllRefs(spec)

// 5. 与 contract/api.md 接口清单双向一致性校验
if (fs.existsSync(mdPath)) {
  try {
    const mdContent = fs.readFileSync(mdPath, 'utf-8')
    const mdRegex = /(GET|POST|PUT|DELETE|PATCH)\s+\/api([/\w{}-]+)/gi
    const mdEndpoints = new Set()

    for (const match of mdContent.matchAll(mdRegex)) {
      mdEndpoints.add(`${match[1].toUpperCase()} ${match[2]}`)
    }

    const missingInMd = []
    for (const ep of specEndpoints) {
      if (!mdEndpoints.has(ep)) {
        missingInMd.push(ep)
      }
    }

    const extraInMd = []
    for (const ep of mdEndpoints) {
      if (!specEndpoints.has(ep)) {
        extraInMd.push(ep)
      }
    }

    missingInMd.sort()
    extraInMd.sort()

    for (const ep of missingInMd) {
      const spaceIdx = ep.indexOf(' ')
      const m = ep.slice(0, spaceIdx)
      const p = ep.slice(spaceIdx + 1)
      errors.push(`api.md 缺少契约中定义的接口: ${m} /api${p}`)
    }

    for (const ep of extraInMd) {
      const spaceIdx = ep.indexOf(' ')
      const m = ep.slice(0, spaceIdx)
      const p = ep.slice(spaceIdx + 1)
      errors.push(`api.md 包含契约中未定义的接口: ${m} /api${p}`)
    }
  } catch (e) {
    errors.push(`读取 api.md 失败: ${e.message || e}`)
  }
}

// 6. 校验汇总与退出
if (errors.length > 0) {
  console.log(`❌ 契约校验失败，共发现 ${errors.length} 处错误:`)
  for (const err of errors) {
    console.log(`  - ${err}`)
  }
  process.exit(1)
} else {
  console.log(
    `✔ 契约校验通过: ${specEndpoints.size} 个接口与 ${Object.keys(operationIds).length} 个 operationId 均合法且一致`,
  )
  process.exit(0)
}
