#!/usr/bin/env node
// Start the whole software stack in one terminal:
//   npm run dev                  backend + web + edge-ai (camera)
//   npm run dev -- --no-edge     skip edge-ai (no camera / only dashboard)
//   npm run dev -- --no-backend  skip backend (it is already running elsewhere)
//   npm run dev -- --no-web      skip web
//
// Backend is started first and we wait for /health before launching web and edge,
// because edge-ai fetches the zone from the backend at startup.
// Ctrl+C tears down every child (and its grandchildren on Windows).

import { spawn } from 'node:child_process'
import { get } from 'node:http'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const IS_WIN = process.platform === 'win32'
const HEALTH_URL = 'http://127.0.0.1:3000/health'

const COLORS = { backend: '\x1b[36m', web: '\x1b[35m', edge: '\x1b[33m', dev: '\x1b[90m' }
const RESET = '\x1b[0m'

const flags = new Set(process.argv.slice(2))
const want = (name) => !flags.has(`--no-${name.toLowerCase()}`)
const tag = (name) => `${COLORS[name] ?? ''}[${name}]${RESET}`

const children = []

function killTree(child) {
  if (!child || child.exitCode !== null) return
  if (IS_WIN) {
    spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
  } else {
    try {
      process.kill(-child.pid, 'SIGTERM')
    } catch {
      child.kill('SIGTERM')
    }
  }
}

function shutdown(code = 0) {
  for (const c of children) killTree(c)
  process.exit(code)
}

process.on('SIGINT', () => shutdown(130))
process.on('SIGTERM', () => shutdown(143))

function launch(name, command, args, { cwd } = {}) {
  const child = spawn(command, args, { cwd: cwd ?? ROOT, shell: true, stdio: ['ignore', 'pipe', 'pipe'] })
  children.push(child)
  const prefix = tag(name)
  for (const stream of [child.stdout, child.stderr]) {
    stream.setEncoding('utf8')
    let buf = ''
    stream.on('data', (chunk) => {
      buf += chunk
      const lines = buf.split(/\r?\n/)
      buf = lines.pop() ?? ''
      for (const line of lines) if (line.length) process.stdout.write(`${prefix} ${line}\n`)
    })
  }
  child.on('exit', (code, signal) => {
    process.stdout.write(`${prefix} exited (code=${code}, signal=${signal})\n`)
  })
  return child
}

function waitForHealth(timeoutMs = 90_000) {
  return new Promise((resolve) => {
    const start = Date.now()
    const check = () => {
      get(HEALTH_URL, (res) => {
        res.resume()
        if (res.statusCode === 200) return resolve(true)
        if (Date.now() - start > timeoutMs) return resolve(false)
        setTimeout(check, 1000)
      }).on('error', () => {
        if (Date.now() - start > timeoutMs) return resolve(false)
        setTimeout(check, 1000)
      })
    }
    check()
  })
}

async function main() {
  process.stdout.write(`${tag('dev')} starting stack at ${ROOT}\n`)

  if (want('BACKEND')) {
    process.stdout.write(`${tag('dev')} starting backend, waiting for ${HEALTH_URL} ...\n`)
    launch('backend', 'npm', ['run', 'backend:dev'])
    const ok = await waitForHealth()
    if (!ok) {
      process.stderr.write(`${tag('dev')} backend did not become healthy in time\n`)
      shutdown(1)
    }
    process.stdout.write(`${tag('dev')} backend healthy\n`)
  } else {
    process.stdout.write(`${tag('dev')} backend skipped (--no-backend)\n`)
  }

  if (want('WEB')) launch('web', 'npm', ['run', 'web:dev'])
  else process.stdout.write(`${tag('dev')} web skipped (--no-web)\n`)
  if (want('EDGE')) launch('edge', 'npm', ['run', 'edge:run'])
  else process.stdout.write(`${tag('dev')} edge skipped (--no-edge)\n`)

  process.stdout.write(`${tag('dev')} selected services started. Press Ctrl+C to stop everything.\n`)
  if (want('WEB')) process.stdout.write(`${tag('dev')} web: http://localhost:5173\n`)
  if (want('BACKEND')) process.stdout.write(`${tag('dev')} docs: http://localhost:3000/api/docs\n`)
}

main().catch((err) => {
  console.error(err)
  shutdown(1)
})