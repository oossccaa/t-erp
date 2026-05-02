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
 *   node scripts/run-electron.js --dev    # 開發模式 (DESKTOP_DEV=true, DevTools 開)
 */

const { spawnSync } = require('child_process')
const path = require('path')

const isDev = process.argv.includes('--dev')
const desktopRoot = path.resolve(__dirname, '..')

// 1. 編譯 TS（dev 模式才跑，純 start 預設 dist 已存在）
//    用 pnpm exec 而不是 npx：pnpm 在 Windows 沒幫子 workspace 建 .bin/tsc shim 時
//    npx 找不到，但 pnpm exec 會走 workspace dependency tree 找到 typescript。
if (isDev) {
  const tsc = spawnSync('pnpm', ['exec', 'tsc'], {
    cwd: desktopRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  if (tsc.status !== 0) {
    console.error('tsc 編譯失敗')
    process.exit(tsc.status || 1)
  }
}

// 2. 準備啟動環境
//    某些 IDE / 終端機可能設了 ELECTRON_RUN_AS_NODE=1（會強迫 Electron binary 用 Node 模式跑）
//    必須清掉，否則我們的 main.ts 看不到 GUI
const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE
if (isDev) env.DESKTOP_DEV = 'true'

// 3. 找 electron binary（跨平台）
const electronBin = path.join(
  desktopRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'electron.cmd' : 'electron',
)

// 4. 啟動
const electron = spawnSync(electronBin, ['.'], {
  cwd: desktopRoot,
  stdio: 'inherit',
  env,
  shell: process.platform === 'win32', // Windows 上 .cmd 要 shell
})

process.exit(electron.status || 0)
