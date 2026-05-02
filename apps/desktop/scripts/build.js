#!/usr/bin/env node
/**
 * 桌機版完整 build 流程（跨平台 Mac / Windows / Linux）：
 * 1. 編譯 backend (nest build)
 * 2. 編譯 admin (vite build, base=./, API 指向 localhost:3939)
 * 3. 編譯 desktop main process (tsc)
 * 4. pnpm deploy backend → apps/desktop/build-resources/backend
 *    （pnpm deploy 不會帶 dist/，所以 step 5 補上）
 * 5. 把 backend/dist 複製進 deploy
 * 6. Rebuild native modules（對齊 Electron Node ABI）
 *
 * 完成後 package:mac / package:win 就能打對應 platform 的安裝包。
 */

const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..')
const DESKTOP_DIR = path.join(REPO_ROOT, 'apps', 'desktop')
const BACKEND_DIR = path.join(REPO_ROOT, 'apps', 'backend')
const ADMIN_DIR = path.join(REPO_ROOT, 'apps', 'admin')
const DEPLOY_DIR = path.join(DESKTOP_DIR, 'build-resources', 'backend')

function run(cmd, args, opts = {}) {
  console.log(`\n▶ ${cmd} ${args.join(' ')}`)
  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    // Windows 上 pnpm/npm/tsc 等都是 .cmd, 必須 shell:true 才能解析
    shell: process.platform === 'win32',
    ...opts,
  })
  if (result.status !== 0) {
    console.error(`✗ 失敗 (exit ${result.status}): ${cmd} ${args.join(' ')}`)
    process.exit(result.status || 1)
  }
}

// 1. backend dist
run('pnpm', ['build'], { cwd: BACKEND_DIR })

// 2. admin dist (relative base, API 指向 localhost:3939)
//    桌機版不需要重量功能 → VITE_FEATURE_WEIGHT=false
//    用 spawn env 取代 bash 的 KEY=VAL 前綴 (Windows 不認得)
run('pnpm', ['exec', 'vite', 'build', '--base', './'], {
  cwd: ADMIN_DIR,
  env: {
    ...process.env,
    VITE_API_BASE_URL: 'http://localhost:3939/api/v1',
    VITE_FEATURE_WEIGHT: 'false',
    VITE_TARGET: 'desktop',
  },
})

// 3. desktop main.js
run('pnpm', ['exec', 'tsc'], { cwd: DESKTOP_DIR })

// 4. pnpm deploy backend (flatten deps；不帶 dist 因為 .gitignore)
if (fs.existsSync(DEPLOY_DIR)) {
  fs.rmSync(DEPLOY_DIR, { recursive: true, force: true })
}
run('pnpm', ['--filter', '@t-erp/backend', 'deploy', '--legacy', '--prod', DEPLOY_DIR], {
  cwd: REPO_ROOT,
})

// 5. 補 dist (Node fs.cpSync 跨平台, 取代 cp -R)
const srcDist = path.join(BACKEND_DIR, 'dist')
const dstDist = path.join(DEPLOY_DIR, 'dist')
console.log(`\n▶ copy ${srcDist} → ${dstDist}`)
fs.cpSync(srcDist, dstDist, { recursive: true })

// 6. 對齊 native modules ABI
run('node', ['scripts/rebuild-natives.js'], { cwd: DESKTOP_DIR })

console.log('\n✓ desktop:build 完成')
console.log(`  - backend dist 在 ${dstDist}`)
console.log(`  - admin dist 在 ${path.join(ADMIN_DIR, 'dist')}`)
console.log(`  - desktop main 在 ${path.join(DESKTOP_DIR, 'dist')}`)
console.log('\n下一步：')
if (process.platform === 'win32') {
  console.log('  pnpm --filter @t-erp/desktop package:win  → 打 .exe installer')
} else if (process.platform === 'darwin') {
  console.log('  pnpm --filter @t-erp/desktop package:mac  → 打 dmg')
} else {
  console.log('  pnpm --filter @t-erp/desktop package:linux → 打 AppImage')
}
