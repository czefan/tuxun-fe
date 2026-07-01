#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { gzipSync } from 'node:zlib'

const DEFAULT_DIST_DIR = 'dist/build/mp-weixin'
const SINGLE_PACKAGE_LIMIT = Number(process.env.MP_SINGLE_PACKAGE_LIMIT || 2 * 1024 * 1024)
const TOTAL_PACKAGE_LIMIT = Number(process.env.MP_TOTAL_PACKAGE_LIMIT || 20 * 1024 * 1024)

const distDir = path.resolve(process.cwd(), process.argv[2] || process.env.MP_DIST_DIR || DEFAULT_DIST_DIR)

if (!fs.existsSync(distDir)) {
  console.error(`Weixin package output not found: ${distDir}`)
  console.error('Run pnpm build:mp:prod before package size analysis.')
  process.exit(1)
}

const appJsonPath = path.join(distDir, 'app.json')
const appJson = fs.existsSync(appJsonPath) ? readJson(appJsonPath) : {}
const subPackageRoots = normalizeSubPackageRoots(appJson.subPackages || appJson.subpackages)
const files = walkFiles(distDir)
const fileStats = files.map(filePath => createFileStat(distDir, filePath))
const rows = createRows(fileStats, subPackageRoots)
const total = sumStats(fileStats)
const warnings = createWarnings(rows, total)

printReport(distDir, rows, total, warnings)

if (warnings.length > 0 && process.env.MP_SIZE_STRICT === 'true') {
  process.exitCode = 1
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  }
  catch (error) {
    console.error(`Failed to parse ${filePath}: ${(error).message}`)
    process.exit(1)
  }
}

function normalizeSubPackageRoots(subPackages) {
  if (!Array.isArray(subPackages)) {
    return []
  }

  return subPackages
    .map(item => typeof item?.root === 'string' ? normalizePath(item.root) : '')
    .filter(Boolean)
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

function createFileStat(rootDir, filePath) {
  const content = fs.readFileSync(filePath)

  return {
    path: normalizePath(path.relative(rootDir, filePath)),
    raw: content.byteLength,
    gzip: gzipSync(content).byteLength,
  }
}

function createRows(stats, subPackageRoots) {
  const subPackageRows = subPackageRoots.map((root) => {
    const files = stats.filter(file => isInRoot(file.path, root))

    return {
      name: root,
      root,
      ...sumStats(files),
    }
  })

  const mainFiles = stats.filter(file =>
    !subPackageRoots.some(root => isInRoot(file.path, root)),
  )

  return [
    {
      name: 'main',
      root: '.',
      ...sumStats(mainFiles),
    },
    ...subPackageRows,
  ]
}

function sumStats(stats) {
  return stats.reduce(
    (total, file) => ({
      files: total.files + 1,
      raw: total.raw + file.raw,
      gzip: total.gzip + file.gzip,
    }),
    { files: 0, raw: 0, gzip: 0 },
  )
}

function createWarnings(rows, total) {
  const warnings = []

  for (const row of rows) {
    if (row.raw > SINGLE_PACKAGE_LIMIT) {
      warnings.push(`${row.name} raw size ${formatBytes(row.raw)} exceeds ${formatBytes(SINGLE_PACKAGE_LIMIT)}`)
    }
  }

  if (total.raw > TOTAL_PACKAGE_LIMIT) {
    warnings.push(`total raw size ${formatBytes(total.raw)} exceeds ${formatBytes(TOTAL_PACKAGE_LIMIT)}`)
  }

  return warnings
}

function printReport(rootDir, rows, total, warnings) {
  const nameWidth = Math.max('Package'.length, ...rows.map(row => row.name.length))

  console.log(`Weixin package size report: ${rootDir}`)
  console.log(`${padEnd('Package', nameWidth)}  Raw        Gzip       Files`)
  console.log(`${padEnd('-'.repeat(nameWidth), nameWidth)}  ---------  ---------  -----`)

  for (const row of rows) {
    console.log(`${padEnd(row.name, nameWidth)}  ${padStart(formatBytes(row.raw), 9)}  ${padStart(formatBytes(row.gzip), 9)}  ${padStart(String(row.files), 5)}`)
  }

  console.log(`${padEnd('total', nameWidth)}  ${padStart(formatBytes(total.raw), 9)}  ${padStart(formatBytes(total.gzip), 9)}  ${padStart(String(total.files), 5)}`)

  if (warnings.length > 0) {
    console.log('\nWarnings:')
    for (const warning of warnings) {
      console.log(`- ${warning}`)
    }
  }
}

function isInRoot(filePath, root) {
  return filePath === root || filePath.startsWith(`${root}/`)
}

function normalizePath(value) {
  return value.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '')
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
