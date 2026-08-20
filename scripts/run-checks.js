import { spawn } from 'node:child_process'
import process from 'node:process'

const scripts = process.argv.slice(2)

if (scripts.length === 0) {
  console.error('Usage: node ./scripts/run-checks.js <script...>')
  process.exit(1)
}

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const children = new Set()
const results = []

function runScript(script) {
  return new Promise((resolve) => {
    console.log(`[${script}] started`)

    const child = spawn(pnpm, ['run', script], {
      stdio: 'inherit',
    })

    children.add(child)

    child.on('error', (error) => {
      children.delete(child)
      resolve({ script, code: 1, error })
    })

    child.on('close', (code, signal) => {
      children.delete(child)
      console.log(`[${script}] ${code === 0 ? 'passed' : 'failed'}`)
      resolve({ script, code: code ?? 1, signal })
    })
  })
}

function stopChildren(signal) {
  for (const child of children) {
    child.kill(signal)
  }
}

process.on('SIGINT', () => {
  stopChildren('SIGINT')
  process.exit(130)
})

process.on('SIGTERM', () => {
  stopChildren('SIGTERM')
  process.exit(143)
})

const CONCURRENCY = Number(process.env.CHECK_CONCURRENCY) || 2

async function runAll(list) {
  const queue = [...list]
  const listResults = []
  const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    while (queue.length > 0) {
      const nextScript = queue.shift()
      if (nextScript) {
        listResults.push(await runScript(nextScript))
      }
    }
  })
  await Promise.all(workers)
  return listResults
}

results.push(...await runAll(scripts))

const failures = results.filter(result => result.code !== 0)

if (failures.length > 0) {
  for (const failure of failures) {
    const reason = failure.error?.message ?? failure.signal ?? `exit ${failure.code}`
    console.error(`[${failure.script}] failed: ${reason}`)
  }
  process.exit(1)
}
