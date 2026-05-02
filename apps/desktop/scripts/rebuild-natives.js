#!/usr/bin/env node
/**
 * 把 native modules 對齊到 Electron 內建 Node 的 ABI。
 *
 * 為什麼不用 @electron/rebuild：
 *   不支援 pnpm 的 .pnpm/<pkg>@<version>_... node_modules 結構，
 *   跑一半就 ENOENT @ampproject/remapping。
 *
 * 為什麼用 npm rebuild 而不是直接 node-gyp rebuild：
 *   better-sqlite3 install hook = `prebuild-install || node-gyp rebuild`
 *   設好 npm_config_target/runtime 環境變數後 prebuild-install 會去
 *   GitHub Releases 抓對應 Electron ABI + 平台 + 架構的預編 binary，
 *   不用本機有 C++ toolchain (Windows 上特別有用，免裝 VS Build Tools)。
 *   抓不到才 fallback 到 node-gyp（這時才需要 C++ toolchain）。
 *
 * 用法：
 *   node apps/desktop/scripts/rebuild-natives.js
 */

const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..')
const PNPM_DIR = path.join(REPO_ROOT, 'node_modules', '.pnpm')

// 抓實際安裝的 electron 版本
if (!fs.existsSync(PNPM_DIR)) {
  console.error('node_modules/.pnpm 不存在，請先 pnpm install')
  process.exit(1)
}
const installedElectron = fs.readdirSync(PNPM_DIR).find((d) => d.startsWith('electron@'))
if (!installedElectron) {
  console.error('找不到已安裝的 electron')
  process.exit(1)
}
const electronVersion = installedElectron.replace(/^electron@/, '').split('_')[0]
console.log(`▶ Electron ${electronVersion} on ${process.platform}-${process.arch}`)

// 要對齊的 native modules（pnpm 目錄前綴）
const NATIVE_MODULES = ['better-sqlite3@']

const targets = []

// 1. content-addressable store 裡的副本（dev 用）
for (const prefix of NATIVE_MODULES) {
  const matches = fs.readdirSync(PNPM_DIR).filter((d) => d.startsWith(prefix))
  if (matches.length === 0) {
    console.warn(`⚠ 找不到 ${prefix}*`)
    continue
  }
  const moduleName = prefix.replace('@', '')
  for (const m of matches) {
    const moduleDir = path.join(PNPM_DIR, m, 'node_modules', moduleName)
    if (fs.existsSync(moduleDir)) targets.push({ name: moduleName, dir: moduleDir })
  }
}

// 2. pnpm deploy 出來的副本（打包用）
const DEPLOY_DIR = path.join(__dirname, '..', 'build-resources', 'backend', 'node_modules')
if (fs.existsSync(DEPLOY_DIR)) {
  for (const prefix of NATIVE_MODULES) {
    const moduleName = prefix.replace('@', '')
    const moduleDir = path.join(DEPLOY_DIR, moduleName)
    if (fs.existsSync(moduleDir)) targets.push({ name: `${moduleName} (deploy)`, dir: moduleDir })
  }
}

if (targets.length === 0) {
  console.log('沒有需要 rebuild 的 native 模組')
  process.exit(0)
}

// 跨平台的 npm 路徑
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'

for (const { name, dir } of targets) {
  console.log(`\n▶ Rebuilding ${name} @ ${dir}`)

  const result = spawnSync(npmCmd, ['rebuild', '--build-from-source=false'], {
    cwd: dir,
    stdio: 'inherit',
    env: {
      ...process.env,
      // prebuild-install 會用這些抓對的預編 binary
      npm_config_target: electronVersion,
      npm_config_runtime: 'electron',
      npm_config_target_arch: process.arch,
      npm_config_disturl: 'https://electronjs.org/headers',
      npm_config_target_platform: process.platform,
    },
    shell: process.platform === 'win32',
  })

  if (result.status !== 0) {
    console.error(`✗ ${name} 失敗 (exit ${result.status})`)
    if (process.platform === 'win32') {
      console.error('  Windows 提示：如果 prebuild-install 抓不到 binary 退到 node-gyp，')
      console.error('  你需要先裝 Visual Studio Build Tools (含 Desktop C++) + Python 3')
    }
    process.exit(result.status || 1)
  }
  console.log(`✓ ${name} rebuilt`)
}

console.log('\n✓ 全部 native module 對齊完成')
