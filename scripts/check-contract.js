#!/usr/bin/env node
/**
 * 前端契约校验脚本 (check:contract)
 *
 * 校验内容：
 * 1. JSON 格式与 OpenAPI 3.0 基础结构校验
 * 2. 全量路由 operationId 唯一性与非空校验
 * 3. 全量 $ref 内部引用解析校验（支持数组索引，防止悬空引用与同级键忽略陷阱）
 * 4. OpenAPI 细节规约校验（如 nullable 与 enum 组合）
 * 5. 与 contract/api.md 接口清单的双向一致性比对校验
 */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import pc from 'picocolors'

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

const errors = []
const warnings = []

function logError(msg) {
  console.error(`${pc.red('[ERROR]')} ${msg}`)
}

function logWarn(msg) {
  console.warn(`${pc.yellow('[WARN]')} ${msg}`)
}

function logInfo(msg) {
  console.log(`${pc.green('[INFO]')} ${msg}`)
}

if (!fs.existsSync(jsonPath)) {
  logError(`契约文件不存在: ${jsonPath}`)
  process.exit(1)
}

if (!fs.existsSync(mdPath)) {
  logError(`契约 MD 文档不存在: ${mdPath}`)
  process.exit(1)
}

// 2. 校验 JSON 格式与 OpenAPI 3.0 基础结构
logInfo('1. 正在校验 apifox-import.json JSON 结构与合法性...')
let spec
try {
  const content = fs.readFileSync(jsonPath, 'utf-8')
  spec = JSON.parse(content)
} catch (e) {
  logError(`契约 JSON 解析失败: ${e.message || e}`)
  process.exit(1)
}

if (
  !spec ||
  typeof spec !== 'object' ||
  Array.isArray(spec) ||
  !('openapi' in spec) ||
  !('paths' in spec)
) {
  logError('契约格式错误: 缺少 openapi 或 paths 根属性')
  process.exit(1)
}

// 3. $ref 引用解析与 OpenAPI 细节规约
function resolveRef(refStr, doc) {
  if (!refStr.startsWith('#/')) {
    return false
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

function walkAndCheckNode(node, nodePath = 'root') {
  if (node && typeof node === 'object' && !Array.isArray(node)) {
    const keys = Object.keys(node)
    if ('$ref' in node && keys.length > 1) {
      const extraKeys = keys.filter((k) => k !== '$ref')
      warnings.push(
        `在 ${nodePath} 发现 $ref 的同级键 (${extraKeys.join(', ')})，OpenAPI 3.0 可能会忽略同级属性`,
      )
    }

    if ('$ref' in node) {
      if (typeof node.$ref !== 'string') {
        errors.push(`在 ${nodePath} 发现非法 $ref: 类型必须为 string，实际为 ${typeof node.$ref}`)
      } else if (!resolveRef(node.$ref, spec)) {
        errors.push(`在 ${nodePath} 发现无法解析的悬空 $ref: '${node.$ref}'`)
      }
    }

    if (node.nullable === true && Array.isArray(node.enum)) {
      if (!node.enum.includes(null)) {
        warnings.push(
          `在 ${nodePath} 发现 nullable: true 但 enum 中未包含 null: ${JSON.stringify(node.enum)}`,
        )
      }
    }

    for (const [k, v] of Object.entries(node)) {
      walkAndCheckNode(v, `${nodePath}.${k}`)
    }
  } else if (Array.isArray(node)) {
    node.forEach((item, idx) => {
      walkAndCheckNode(item, `${nodePath}[${idx}]`)
    })
  }
}

// 4. operationId 唯一性与非空校验
logInfo('2. 正在校验 operationId 唯一性、$ref 可解析性与 OpenAPI 细节规约...')
const HTTP_METHODS = new Set(['get', 'post', 'put', 'delete', 'patch', 'options', 'head'])
const operationIds = new Map()
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
      } else if (operationIds.has(opId)) {
        errors.push(
          `${methodUpper} ${routePath}: operationId '${opId}' 与 ${operationIds.get(opId)} 重复`,
        )
      } else {
        operationIds.set(opId, `${methodUpper} ${routePath}`)
      }
    }
  }
}

walkAndCheckNode(spec)

// 5. 与 api.md 接口清单双向一致性比对
logInfo('3. 正在校验 api.md 与 apifox-import.json 接口列表一致性...')
try {
  const mdContent = fs.readFileSync(mdPath, 'utf-8')
  const mdRegex = /(GET|POST|PUT|DELETE|PATCH)\s+([^\s`]+)/g
  const mdEndpoints = new Set()

  for (const match of mdContent.matchAll(mdRegex)) {
    const method = match[1].toUpperCase()
    let p = match[2]
      .trim()
      .split('?')[0]
      .replace(/[*_~),.:;]+$/, '')
    if (p.startsWith('/api')) {
      p = p.slice(4)
    }
    if (!p.startsWith('/')) {
      p = `/${p}`
    }
    mdEndpoints.add(`${method} ${p}`)
  }

  for (const endpoint of specEndpoints) {
    if (!mdEndpoints.has(endpoint)) {
      warnings.push(`接口 ${endpoint} 存在于 JSON 中，但未在 api.md 中找到对应文档`)
    }
  }

  for (const endpoint of mdEndpoints) {
    if (!specEndpoints.has(endpoint)) {
      errors.push(`接口 ${endpoint} 存在于 api.md 中，但在 apifox-import.json 中未找到`)
    }
  }
} catch (e) {
  errors.push(`读取 api.md 失败: ${e.message || e}`)
}

// 6. 校验汇总与退出
console.log('\n--- 契约校验总结 ---')
logInfo(`JSON 接口总数: ${specEndpoints.size}, operationId 总数: ${operationIds.size}`)

if (warnings.length > 0) {
  logWarn(`共发现 ${warnings.length} 处警告 (Warnings):`)
  for (const warn of warnings) {
    console.warn(`  - ${warn}`)
  }
}

if (errors.length > 0) {
  logError(`校验未通过！共发现 ${errors.length} 处错误 (Errors):`)
  for (const err of errors) {
    console.error(`  - ${err}`)
  }
  process.exit(1)
} else {
  logInfo(pc.bold('契约校验全部通过！✅'))
}
