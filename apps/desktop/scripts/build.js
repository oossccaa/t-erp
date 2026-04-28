#!/usr/bin/env node
/**
 * 桌機版完整 build 流程：
 * 1. 編譯 backend (nest build)
 * 2. 編譯 admin (vite build, base=./, API 指向 localhost:3939)
 * 3. 編譯 desktop main process (tsc)
 * 4. pnpm deploy backend → apps/desktop/build-resources/backend
 *    （pnpm deploy 不會帶 dist/，所以 step 5 補上）
 * 5. 把 backend/dist 複製進 deploy
 * 6. Rebuild native modules（給 Electron Node ABI + 補 bcrypt prebuilt）
 *
 * 完成後 `pnpm --filter @t-erp/desktop package:mac` 就能打 dmg。
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..')
const DESKTOP_DIR = path.join(REPO_ROOT, 'apps', 'desktop')
const BACKEND_DIR = path.join(REPO_ROOT, 'apps', 'backend')
const ADMIN_DIR = path.join(REPO_ROOT, 'apps', 'admin')
const DEPLOY_DIR = path.join(DESKTOP_DIR, 'build-resources', 'backend')

function run(cmd, opts = {}) {
  console.log(`\n▶ ${cmd}`)
  execSync(cmd, { stdio: 'inherit', shell: '/bin/bash', ...opts })
}

// 1. backend dist
run('pnpm build', { cwd: BACKEND_DIR })

// 2. admin dist (relative base, API 指向 localhost:3939)
run(
  'VITE_API_BASE_URL=http://localhost:3939/api/v1 VITE_FEATURE_WEIGHT=true VITE_TARGET=desktop pnpm exec vite build --base ./',
  { cwd: ADMIN_DIR },
)

// 3. desktop main.js
run('pnpm exec tsc', { cwd: DESKTOP_DIR })

// 4. pnpm deploy backend (flatten deps；不帶 dist 因為 .gitignore)
if (fs.existsSync(DEPLOY_DIR)) {
  fs.rmSync(DEPLOY_DIR, { recursive: true, force: true })
}
run(`pnpm --filter @t-erp/backend deploy --legacy --prod "${DEPLOY_DIR}"`, { cwd: REPO_ROOT })

// 5. 補 dist
const srcDist = path.join(BACKEND_DIR, 'dist')
const dstDist = path.join(DEPLOY_DIR, 'dist')
run(`cp -R "${srcDist}" "${dstDist}"`)

// 6. 對齊 native modules ABI + bcrypt prebuilt
run('node scripts/rebuild-natives.js', { cwd: DESKTOP_DIR })

console.log('\n✓ desktop:build 完成')
console.log(`  - backend dist 在 ${dstDist}`)
console.log(`  - admin dist 在 ${path.join(ADMIN_DIR, 'dist')}`)
console.log(`  - desktop main 在 ${path.join(DESKTOP_DIR, 'dist')}`)
console.log('\n下一步：pnpm --filter @t-erp/desktop package:mac  → 打 dmg')
