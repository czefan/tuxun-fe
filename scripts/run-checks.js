import { Buffer } from 'node:buffer'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import pc from 'picocolors'

/**
 * 任务并发权重画像
 * LIGHT (1): 静态检查、契约、knip、eslint
 * HEAVY (2): 编译、单进程测试
 */
const TASK_WEIGHTS = {
  'check:contract': 1,
  'check:boundaries': 1,
  'check:assets': 1,
  'lint:quick': 1,
  'lint:eslint': 1,
  knip: 1,
  'type-check': 2,
  'test:run': 2,
  test: 2,
}

const PROJECT_ROOT = process.cwd()
let pkgScripts = {}
try {
  const pkgContent = fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8')
  pkgScripts = JSON.parse(pkgContent).scripts || {}
} catch {}

const binDir = path.join(PROJECT_ROOT, 'node_modules', '.bin')
const pathEnvKey = Object.keys(process.env).find((k) => k.toUpperCase() === 'PATH') || 'PATH'
const existingPath = process.env[pathEnvKey] || ''
const childEnv = {
  ...process.env,
  [pathEnvKey]: `${binDir}${path.delimiter}${existingPath}`,
  FORCE_COLOR: process.env.FORCE_COLOR ?? '1',
}

function getCapacity() {
  if (process.env.CHECK_CAPACITY) {
    const val = Number.parseInt(process.env.CHECK_CAPACITY, 10)
    if (Number.isInteger(val) && val > 0) return val
  }
  const cpus = os.cpus()?.length || 4
  const totalGb = os.totalmem() / 1024 ** 3

  // 极低配环境（< 2.5GB 内存 或 单/双核）：保守限制
  if (totalGb < 2.5 || cpus <= 2) return 2
  // 中低配环境（< 4GB 内存）：适度并发
  if (totalGb < 4 || cpus <= 4) return 4
  // 标准及以上开发机/多核环境（>= 4GB 内存 & > 4 核）：允许充足并发
  return 10
}

const scripts = process.argv.slice(2)
if (scripts.length === 0) {
  console.error(pc.red('Usage: node ./scripts/run-checks.js <script...>'))
  process.exit(1)
}

const activeProcesses = new Map()
let isAborting = false
const CAPACITY = getCapacity()
let currentUsedTokens = 0
let completedCounter = 0
const totalTasks = scripts.length

function stopAllProcesses() {
  if (isAborting) return
  isAborting = true
  for (const [child] of activeProcesses.entries()) {
    try {
      if (!child?.pid) continue
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
      } else {
        process.kill(-child.pid, 'SIGTERM')
      }
    } catch {}
  }
}

process.on('SIGINT', () => {
  console.log(pc.yellow('\n\n  User interrupted. Terminating tasks...\n'))
  stopAllProcesses()
  process.exit(130)
})

process.on('SIGTERM', () => {
  stopAllProcesses()
  process.exit(143)
})

function formatDuration(ms) {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`
}

function runScript(script) {
  return new Promise((resolve) => {
    const startTime = Date.now()
    const weight = TASK_WEIGHTS[script] ?? 2
    const outputChunks = []
    let isSettled = false

    const rawCommand = pkgScripts[script]
    let child
    if (rawCommand) {
      child = spawn(rawCommand, {
        shell: true,
        stdio: ['inherit', 'pipe', 'pipe'],
        detached: process.platform !== 'win32',
        env: childEnv,
      })
    } else {
      const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
      child = spawn(pnpm, ['run', script], {
        stdio: ['inherit', 'pipe', 'pipe'],
        detached: process.platform !== 'win32',
        env: childEnv,
      })
    }

    activeProcesses.set(child, { script, startTime, weight })

    child.stdout?.on('data', (c) => outputChunks.push(c))
    child.stderr?.on('data', (c) => outputChunks.push(c))

    child.on('error', (error) => {
      if (isSettled) return
      isSettled = true
      activeProcesses.delete(child)
      completedCounter += 1
      const duration = Date.now() - startTime
      console.error(
        `  ${pc.red('✖')} ${pc.dim(`[${completedCounter}/${totalTasks}]`)} ${pc.red(script.padEnd(18))} ${pc.red(formatDuration(duration))} ${pc.red(`(${error.message})`)}`,
      )
      resolve({ script, code: 1, duration, output: error.message, wasAborted: isAborting })
    })

    child.on('close', (code, signal) => {
      if (isSettled) return
      isSettled = true
      activeProcesses.delete(child)
      completedCounter += 1
      const duration = Date.now() - startTime
      const wasAborted = isAborting || signal === 'SIGTERM' || signal === 'SIGINT'
      const isSuccess = code === 0
      const output = Buffer.concat(outputChunks).toString('utf8')

      if (isSuccess) {
        console.log(
          `  ${pc.green('✔')} ${pc.dim(`[${completedCounter}/${totalTasks}]`)} ${pc.bold(script.padEnd(18))} ${pc.dim(formatDuration(duration))}`,
        )
      } else if (wasAborted) {
        console.log(
          `  ${pc.yellow('⊘')} ${pc.dim(`[${completedCounter}/${totalTasks}]`)} ${pc.gray(script.padEnd(18))} ${pc.gray('cancelled')}`,
        )
      } else {
        console.error(
          `  ${pc.red('✖')} ${pc.dim(`[${completedCounter}/${totalTasks}]`)} ${pc.bold(pc.red(script.padEnd(18)))} ${pc.red(formatDuration(duration))} ${pc.red(`(exit code ${code ?? signal})`)}`,
        )
      }

      resolve({ script, code: code ?? (wasAborted ? 143 : 1), duration, output, wasAborted })
    })
  })
}

async function schedule(taskList) {
  const globalStartTime = Date.now()
  console.log('')

  const queue = [...taskList].sort((a, b) => (TASK_WEIGHTS[b] ?? 2) - (TASK_WEIGHTS[a] ?? 2))
  const results = []
  const runningPromises = new Set()

  return new Promise((resolve) => {
    function settleIfDone() {
      if (queue.length === 0 && runningPromises.size === 0) {
        resolve({ results, totalDuration: Date.now() - globalStartTime })
      }
    }

    function tryLaunchNext() {
      if (isAborting) {
        settleIfDone()
        return
      }

      let launched = true
      while (launched && queue.length > 0) {
        launched = false
        for (let i = 0; i < queue.length; i++) {
          const nextScript = queue[i]
          const weight = TASK_WEIGHTS[nextScript] ?? 2

          if (currentUsedTokens === 0 || currentUsedTokens + weight <= CAPACITY) {
            queue.splice(i, 1)
            currentUsedTokens += weight
            launched = true

            const taskPromise = runScript(nextScript).then((result) => {
              currentUsedTokens -= weight
              runningPromises.delete(taskPromise)
              results.push(result)

              if (result.code !== 0) {
                stopAllProcesses()
                queue.length = 0
                settleIfDone()
              } else {
                tryLaunchNext()
              }
              return result
            })

            runningPromises.add(taskPromise)
            break
          }
        }
      }

      settleIfDone()
    }

    tryLaunchNext()
  })
}

const { results: allResults, totalDuration } = await schedule(scripts)
const realFailed = allResults.filter((r) => r.code !== 0 && !r.wasAborted)
const aborted = allResults.filter((r) => r.wasAborted)
const passed = allResults.filter((r) => r.code === 0)

if (realFailed.length > 0) {
  for (const f of realFailed) {
    if (f.output?.trim()) {
      console.error(
        `\n${pc.red('⎯'.repeat(16))} ${pc.bold(pc.red(`FAIL ${f.script}`))} ${pc.red('⎯'.repeat(16))}`,
      )
      console.error(f.output.trim())
      console.error(pc.red('⎯'.repeat(40)))
    }
  }

  const parts = [
    pc.bold(pc.red(`${realFailed.length} failed`)),
    pc.green(`${passed.length} passed`),
  ]
  if (aborted.length > 0) parts.push(pc.yellow(`${aborted.length} cancelled`))
  parts.push(`${totalTasks} total`)

  console.log(`\n  ${pc.bold('Tasks:')}   ${parts.join(pc.dim(' | '))}`)
  console.log(`  ${pc.bold('Time:')}    ${pc.dim(formatDuration(totalDuration))}\n`)
  process.exit(1)
} else if (aborted.length > 0) {
  console.log(
    `\n  ${pc.bold('Tasks:')}   ${pc.yellow(`${aborted.length} cancelled`)}, ${totalTasks} total`,
  )
  console.log(`  ${pc.bold('Time:')}    ${pc.dim(formatDuration(totalDuration))}\n`)
  process.exit(143)
} else {
  console.log(
    `\n  ${pc.bold('Tasks:')}   ${pc.bold(pc.green(`${passed.length} passed`))}, ${totalTasks} total`,
  )
  console.log(`  ${pc.bold('Time:')}    ${pc.dim(formatDuration(totalDuration))}\n`)
  process.exit(0)
}
