#!/usr/bin/env node
/**
 * 跨平台啟動 Electron
 *
 * 為什麼不用 package.json 直接寫：
 *   "dev": "unset ELECTRON_RUN_AS_NODE && DESKTOP_DEV=true electron ."
 * 因為 unset / KEY=VAL 是 bash 語法，Windows cmd / PowerShell 不認得。
 *
 * 用法：
 *   node scripts/run-electron.js          # 純啟動 (start)
 *   node scripts/run-electron.js --dev    # 開發模式 (DESKTOP_DEV=true)
 *
 * dev 模式會先把 backend / admin / desktop 三邊都 build 一次
 * （main.ts 在 dev 模式下從 apps/{backend,admin}/dist 載入，
 *   沒先 build 會炸 "backend 入口不存在"）
 */

const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const isDev = process.argv.includes('--dev')
const desktopRoot = path.resolve(__dirname, '..')
const repoRoot = path.resolve(desktopRoot, '..', '..')
const backendDir = path.join(repoRoot, 'apps', 'backend')
const adminDir = path.join(repoRoot, 'apps', 'admin')

function run(cmd, args, opts = {}) {
  console.log(`▶ ${cmd} ${args.join(' ')}  (${opts.cwd || process.cwd()})`)
  const r = spawnSync(cmd, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32', // Windows 上 .cmd 要 shell
    ...opts,
  })
  if (r.status !== 0) {
    console.error(`✗ 失敗: ${cmd} ${args.join(' ')}`)
    process.exit(r.status || 1)
  }
}

if (isDev) {
  // 1. backend dist (nest build)
  if (!fs.existsSync(path.join(backendDir, 'dist', 'main.js'))) {
    console.log('\n=== backend 還沒 build, 開始建 ===')
    run('pnpm', ['build'], { cwd: backendDir })
  }

  // 2. admin dist (vite build with relative base + API → localhost:3939)
  if (!fs.existsSync(path.join(adminDir, 'dist', 'index.html'))) {
    console.log('\n=== admin 還沒 build, 開始建 ===')
    run('pnpm', ['exec', 'vite', 'build', '--base', './'], {
      cwd: adminDir,
      env: {
        ...process.env,
        VITE_API_BASE_URL: 'http://localhost:3939/api/v1',
        VITE_FEATURE_WEIGHT: 'false',
        VITE_TARGET: 'desktop',
      },
    })
  }

  // 3. desktop main.js (tsc)
  console.log('\n=== compile desktop main process ===')
  run('pnpm', ['exec', 'tsc'], { cwd: desktopRoot })
}

// 4. 準備啟動環境
//    某些 IDE / 終端機可能設了 ELECTRON_RUN_AS_NODE=1（會強迫 Electron binary 用 Node 模式跑）
//    必須清掉，否則我們的 main.ts 看不到 GUI
const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE
if (isDev) env.DESKTOP_DEV = 'true'

// 5. 找 electron binary（跨平台）
const electronBin = path.join(
  desktopRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'electron.cmd' : 'electron',
)

// 6. 啟動
console.log('\n=== launching Electron ===')
const electron = spawnSync(electronBin, ['.'], {
  cwd: desktopRoot,
  stdio: 'inherit',
  env,
  shell: process.platform === 'win32',
})

process.exit(electron.status || 0)
