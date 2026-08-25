import { spawn } from 'node:child_process'
import os from 'node:os'
import process from 'node:process'

/**
 * 任务内存/负载权重画像（总预算 CAPACITY = 4 Tokens）
 * LIGHT (1): 内存 < 150MB，毫秒/秒级低负载任务（静态检查、契约、knip、eslint）
 * HEAVY (2): 内存 ~200-350MB，单进程复用编译/测试（支持 2 个中轻任务平滑重叠）
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

const DEFAULT_WEIGHT = 2

function getTaskWeight(script) {
  return TASK_WEIGHTS[script] ?? DEFAULT_WEIGHT
}

function getCapacity() {
  if (process.env.CHECK_CAPACITY !== undefined) {
    const parsed = Number.parseInt(process.env.CHECK_CAPACITY, 10)
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed
    }
    console.warn(
      `[warn] ⚠️ CHECK_CAPACITY="${process.env.CHECK_CAPACITY}" 为非法值（须为正整数），已自动回落为默认值 4`,
    )
  }
  const GB = 1024 ** 3
  // 结合「可用内存」与总内存进行安全评估（freemem * 1.5 留出页缓存可回收余量）
  const usableGb = Math.min(os.totalmem(), os.freemem() * 1.5) / GB
  return usableGb < 4 ? 2 : 4
}

const scripts = process.argv.slice(2)

if (scripts.length === 0) {
  console.error('Usage: node ./scripts/run-checks.js <script...>')
  process.exit(1)
}

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const activeProcesses = new Map()
let isAborting = false
const CAPACITY = getCapacity()
let currentUsedTokens = 0

function stopAllProcesses() {
  if (isAborting) return
  isAborting = true
  for (const [child, info] of activeProcesses.entries()) {
    try {
      console.log(`[abort] 🛑 终止任务: ${info.script}`)
      if (process.platform === 'win32') {
        // Windows 没有进程组，用 taskkill /T /F 杀掉整棵子进程树
        spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
      } else {
        // POSIX 负号表示发送信号给整个独立进程组，递归清理 pnpm 拉起的孙进程
        process.kill(-child.pid, 'SIGTERM')
      }
    } catch {}
  }
}

process.on('SIGINT', () => {
  console.log('\n[SIGINT] 用户中断，正在清理子进程树...')
  stopAllProcesses()
  process.exit(130)
})

process.on('SIGTERM', () => {
  stopAllProcesses()
  process.exit(143)
})

function formatDuration(ms) {
  return `${(ms / 1000).toFixed(2)}s`
}

function runScript(script) {
  return new Promise((resolve) => {
    const startTime = Date.now()
    const weight = getTaskWeight(script)

    console.log(`[start] ⏳ [${script}] 启动 (权重: ${weight} Tokens)`)

    const child = spawn(pnpm, ['run', script], {
      stdio: 'inherit',
      // 自成独立进程组，fail-fast / SIGINT 才能连带杀掉 pnpm 拉起的孙进程（如 vue-tsc / vitest）
      detached: process.platform !== 'win32',
      env: {
        ...process.env,
        FORCE_COLOR: process.env.FORCE_COLOR ?? '1',
      },
    })

    activeProcesses.set(child, { script, startTime, weight })

    child.on('error', (error) => {
      activeProcesses.delete(child)
      const duration = Date.now() - startTime
      console.error(
        `[error] ❌ [${script}] 执行出错 (${formatDuration(duration)}): ${error.message}`,
      )
      resolve({ script, code: 1, duration, error, wasAborted: isAborting })
    })

    child.on('close', (code, signal) => {
      activeProcesses.delete(child)
      const duration = Date.now() - startTime
      const wasAborted = isAborting || signal === 'SIGTERM' || signal === 'SIGINT'
      const isSuccess = code === 0

      if (isSuccess) {
        console.log(`[passed] ✅ [${script}] 通过 (${formatDuration(duration)})`)
      } else if (wasAborted) {
        console.log(`[aborted] 🛑 [${script}] 已中止 (${formatDuration(duration)})`)
      } else {
        console.error(
          `[failed] ❌ [${script}] 失败 (退出码: ${code ?? signal}, 耗时: ${formatDuration(duration)})`,
        )
      }

      resolve({ script, code: code ?? (wasAborted ? 143 : 1), duration, signal, wasAborted })
    })
  })
}

async function schedule(taskList) {
  const globalStartTime = Date.now()
  console.log(
    `🚀 启动智能加权自检调度器 (总令牌预算: ${CAPACITY} Tokens, 待检任务: ${taskList.length} 个)\n`,
  )

  // 排序策略：长耗时/计算密集型任务优先启动，轻量任务并行填补剩余令牌间隙
  const queue = [...taskList].sort((a, b) => getTaskWeight(b) - getTaskWeight(a))
  const results = []
  const runningPromises = new Set()

  return new Promise((resolve) => {
    function settleIfDone() {
      if (queue.length === 0 && runningPromises.size === 0) {
        const totalDuration = Date.now() - globalStartTime
        console.log(`\n🏁 全部自检执行完毕，总耗时: ${formatDuration(totalDuration)}`)
        resolve(results)
      }
    }

    function tryLaunchNext() {
      if (isAborting) {
        settleIfDone()
        return
      }

      // 动态装箱算法（消除 Head-of-Line 阻塞）：
      // 当队头大任务放不下时，继续向后扫描并启动当前令牌预算允许容纳的最大/轻量任务
      let launched = true
      while (launched && queue.length > 0) {
        launched = false
        for (let i = 0; i < queue.length; i++) {
          const nextScript = queue[i]
          const weight = getTaskWeight(nextScript)

          // 核心加权约束：当前占用 + 即将运行权重 <= 总预算（且空闲时允许超权任务独占启动）
          if (currentUsedTokens === 0 || currentUsedTokens + weight <= CAPACITY) {
            queue.splice(i, 1)
            currentUsedTokens += weight
            launched = true

            const taskPromise = runScript(nextScript).then((result) => {
              currentUsedTokens -= weight
              runningPromises.delete(taskPromise)
              results.push(result)

              if (result.code !== 0) {
                // 毫秒级 Fail-Fast：一旦任何检查失败，清空队列并终止其他任务
                stopAllProcesses()
                queue.length = 0
                settleIfDone()
              } else {
                tryLaunchNext()
              }
              return result
            })

            runningPromises.add(taskPromise)
            // 成功出队一个任务后，由于剩余令牌数改变，重新从头扫描队列寻找下一个可填充的任务
            break
          }
        }
      }

      settleIfDone()
    }

    tryLaunchNext()
  })
}

const allResults = await schedule(scripts)
const realFailed = allResults.filter((r) => r.code !== 0 && !r.wasAborted)
const aborted = allResults.filter((r) => r.wasAborted)

if (realFailed.length > 0) {
  console.error(`\n❌ 检测到 ${realFailed.length} 个任务未通过:`)
  for (const f of realFailed) {
    console.error(`  - [${f.script}] (${formatDuration(f.duration)})`)
  }
  if (aborted.length > 0) {
    console.log(`\n🛑 另有 ${aborted.length} 个任务已被 Fail-Fast 级联中止:`)
    for (const a of aborted) {
      console.log(`  - [${a.script}] (${formatDuration(a.duration)})`)
    }
  }
  process.exit(1)
} else if (aborted.length > 0) {
  console.log('\n🛑 检测任务已中止')
  process.exit(143)
} else {
  console.log('\n🎉 所有代码质量与类型/测试检查 100% 全部通过！')
  process.exit(0)
}
