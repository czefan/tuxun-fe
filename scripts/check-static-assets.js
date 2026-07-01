#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const DEFAULT_STATIC_DIR = 'src/static'
const DEFAULT_SINGLE_ASSET_LIMIT = 300 * 1024
const DEFAULT_TOTAL_ASSET_LIMIT = 2 * 1024 * 1024
const TRACKED_EXTENSIONS = new Set([
  '.avif',
  '.gif',
  '.jpeg',
  '.jpg',
  '.mp4',
  '.png',
  '.svg',
  '.webm',
  '.webp',
])

const staticDir = path.resolve(process.cwd(), process.argv[2] || process.env.STATIC_ASSET_DIR || DEFAULT_STATIC_DIR)
const singleAssetLimit = readByteLimit('STATIC_ASSET_SINGLE_LIMIT', DEFAULT_SINGLE_ASSET_LIMIT)
const totalAssetLimit = readByteLimit('STATIC_ASSET_TOTAL_LIMIT', DEFAULT_TOTAL_ASSET_LIMIT)
const strict = process.env.STATIC_ASSET_STRICT !== 'false'

if (!fs.existsSync(staticDir)) {
  console.error(`Static asset directory not found: ${staticDir}`)
  process.exit(1)
}

const assets = walkFiles(staticDir)
  .filter(filePath => TRACKED_EXTENSIONS.has(path.extname(filePath).toLowerCase()))
  .map(filePath => ({
    path: normalizePath(path.relative(staticDir, filePath)),
    size: fs.statSync(filePath).size,
  }))
  .sort((left, right) => right.size - left.size)

const totalSize = assets.reduce((sum, asset) => sum + asset.size, 0)
const warnings = createWarnings(assets, totalSize)

printReport(staticDir, assets, totalSize, warnings)

if (strict && warnings.length > 0) {
  process.exitCode = 1
}

function readByteLimit(name, fallback) {
  const rawValue = process.env[name]
  if (!rawValue) {
    return fallback
  }

  const value = Number(rawValue)
  return Number.isFinite(value) && value > 0 ? value : fallback
}

function walkFiles(dir) {
  const result = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      result.push(...walkFiles(fullPath))
    }
    else if (entry.isFile()) {
      result.push(fullPath)
    }
  }

  return result
}

function createWarnings(assets, totalSize) {
  const warnings = []

  for (const asset of assets) {
    if (asset.size > singleAssetLimit) {
      warnings.push(`${asset.path} size ${formatBytes(asset.size)} exceeds ${formatBytes(singleAssetLimit)}`)
    }
  }

  if (totalSize > totalAssetLimit) {
    warnings.push(`static assets total ${formatBytes(totalSize)} exceeds ${formatBytes(totalAssetLimit)}`)
  }

  return warnings
}

function printReport(rootDir, assets, totalSize, warnings) {
  const visibleAssets = assets.slice(0, 20)
  const nameWidth = Math.max('Asset'.length, ...visibleAssets.map(asset => asset.path.length))

  console.log(`Static asset budget report: ${rootDir}`)
  console.log(`Limits: single ${formatBytes(singleAssetLimit)}, total ${formatBytes(totalAssetLimit)}`)
  console.log(`${padEnd('Asset', nameWidth)}  Size`)
  console.log(`${padEnd('-'.repeat(nameWidth), nameWidth)}  ---------`)

  for (const asset of visibleAssets) {
    console.log(`${padEnd(asset.path, nameWidth)}  ${padStart(formatBytes(asset.size), 9)}`)
  }

  if (assets.length > visibleAssets.length) {
    console.log(`${padEnd(`... ${assets.length - visibleAssets.length} more`, nameWidth)}  ${padStart('', 9)}`)
  }

  console.log(`${padEnd('total', nameWidth)}  ${padStart(formatBytes(totalSize), 9)}`)

  if (warnings.length > 0) {
    console.log('\nWarnings:')
    for (const warning of warnings) {
      console.log(`- ${warning}`)
    }
  }
}

function normalizePath(value) {
  return value.replace(/\\/g, '/')
}

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function padEnd(value, length) {
  return value.padEnd(length, ' ')
}

function padStart(value, length) {
  return value.padStart(length, ' ')
}
