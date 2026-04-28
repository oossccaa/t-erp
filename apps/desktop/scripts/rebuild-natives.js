#!/usr/bin/env node
/**
 * Rebuild native modules against Electron's bundled Node ABI.
 *
 * Why this script (instead of @electron/rebuild)：
 *  - @electron/rebuild 不支援 pnpm 的 .pnpm/<pkg>@<version>_... node_modules 結構，
 *    跑一半就 ENOENT @ampproject/remapping。
 *  - 我們自己直接呼叫 node-gyp，已知會在每個 native module 工作。
 *
 * 用法（手動或 postinstall）：
 *   node apps/desktop/scripts/rebuild-natives.js
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..')
const PNPM_DIR = path.join(REPO_ROOT, 'node_modules', '.pnpm')

// 從 desktop 的 package.json 抓 electron 版本
const desktopPkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8'))
const electronRange = desktopPkg.devDependencies.electron
// 找實際安裝版本
const installed = fs.readdirSync(PNPM_DIR).find((d) => d.startsWith('electron@'))
if (!installed) {
  console.error('找不到已安裝的 electron，先 pnpm install')
  process.exit(1)
}
const electronVersion = installed.replace(/^electron@/, '').split('_')[0]
console.log(`▶ Electron ${electronVersion} (range ${electronRange})`)

// 要 rebuild 的 native 模組（pnpm 目錄前綴）
const NATIVE_MODULES = ['better-sqlite3@']

const arch = process.arch
const targets = []

// 1. 開發環境：在 pnpm content-addressable store 裡的副本
for (const prefix of NATIVE_MODULES) {
  const matches = fs.readdirSync(PNPM_DIR).filter((d) => d.startsWith(prefix))
  if (matches.length === 0) {
    console.warn(`⚠ 找不到 ${prefix}*`)
    continue
  }
  for (const m of matches) {
    const moduleName = prefix.replace('@', '')
    const moduleDir = path.join(PNPM_DIR, m, 'node_modules', moduleName)
    if (fs.existsSync(moduleDir)) targets.push({ name: moduleName, dir: moduleDir })
  }
}

// 2. 打包路徑：pnpm deploy 出來的 build-resources/backend/node_modules/<name>
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

for (const { name, dir } of targets) {
  console.log(`\n▶ Rebuilding ${name} @ ${dir}`)
  try {
    execSync(
      `node-gyp rebuild --target=${electronVersion} --arch=${arch} --dist-url=https://electronjs.org/headers`,
      { cwd: dir, stdio: 'inherit' },
    )
    console.log(`✓ ${name} rebuilt`)
  } catch (err) {
    console.error(`✗ ${name} 失敗:`, err.message)
    process.exit(1)
  }
}

// 3. bcrypt 用 N-API（ABI 穩定），只要把預載的 prebuilt binary 複製過去
//    pnpm deploy 不會跑 install 腳本，所以 lib/binding/.../bcrypt_lib.node 不存在
const bcryptDeployDir = path.join(DEPLOY_DIR, 'bcrypt')
if (fs.existsSync(bcryptDeployDir)) {
  const bcryptStore = fs
    .readdirSync(PNPM_DIR)
    .find((d) => d.startsWith('bcrypt@') && !d.startsWith('bcrypt@types'))
  if (bcryptStore) {
    const srcBinding = path.join(PNPM_DIR, bcryptStore, 'node_modules', 'bcrypt', 'lib', 'binding')
    const dstBinding = path.join(bcryptDeployDir, 'lib', 'binding')
    if (fs.existsSync(srcBinding)) {
      execSync(`mkdir -p "${path.dirname(dstBinding)}" && cp -R "${srcBinding}" "${dstBinding}"`)
      console.log(`✓ bcrypt prebuilt 已複製到 deploy`)
    }
  }
}

console.log('\n✓ 全部 rebuild 完成')
