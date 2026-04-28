import { app, BrowserWindow, dialog } from 'electron'
import { spawn, ChildProcess } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import * as http from 'http'

const BACKEND_PORT = 3939
const BACKEND_HOST = '127.0.0.1'
const isDev = process.env.DESKTOP_DEV === 'true'

// 單實例鎖：防止意外多次啟動造成 fork bomb 或 SQLite 衝突。
// 第二個 instance 會立刻退出。
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
  process.exit(0)
}
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

let backend: ChildProcess | null = null
let mainWindow: BrowserWindow | null = null

/**
 * 解析 backend 與 admin 的位置：
 * - 開發模式：用 monorepo 內 source（apps/backend/dist、apps/admin/dist）
 * - 打包模式：用 extraResources 內的 backend / admin
 */
function resolvePaths() {
  if (isDev) {
    const repoRoot = path.resolve(__dirname, '..', '..', '..')
    return {
      backendEntry: path.join(repoRoot, 'apps', 'backend', 'dist', 'main.js'),
      adminIndex: path.join(repoRoot, 'apps', 'admin', 'dist', 'index.html'),
      backendCwd: path.join(repoRoot, 'apps', 'backend'),
    }
  }
  const resourcesPath = process.resourcesPath
  // build-resources/backend 的結構：dist/main.js + node_modules/ + package.json
  return {
    backendEntry: path.join(resourcesPath, 'backend', 'dist', 'main.js'),
    adminIndex: path.join(resourcesPath, 'admin', 'index.html'),
    backendCwd: path.join(resourcesPath, 'backend'),
  }
}

/**
 * 啟動 backend 子行程，環境變數指向使用者本地 SQLite。
 */
function startBackend(): Promise<void> {
  const { backendEntry, backendCwd } = resolvePaths()

  if (!fs.existsSync(backendEntry)) {
    throw new Error(`backend 入口不存在：${backendEntry}\n請先 build backend (pnpm --filter @t-erp/backend build)`)
  }

  const userData = app.getPath('userData')
  const sqlitePath = path.join(userData, 't-erp.db')

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    // 我們用 Electron binary 當 spawn 的 execPath（這樣 packaged 版本不需要外部 Node），
    // 但 backend 是普通 Node 程式 — 必須告訴 Electron「以 Node 模式跑」否則會被當成
    // main process 重啟，造成無限 fork bomb。
    ELECTRON_RUN_AS_NODE: '1',
    NODE_ENV: 'production',
    PORT: String(BACKEND_PORT),
    // 必須跟前端 baseURL 對齊（前端打 /api/v1/...）
    API_PREFIX: 'api/v1',
    // file:// 由 Electron loadFile 載入，請求 backend 時的 Origin 會是 'file://'
    // 同時 packaged app 的視窗自身也會打 backend，所以放行 file:// 與 localhost。
    CORS_ORIGIN: 'file://,http://localhost:3001,http://localhost:3002',
    DB_TYPE: 'sqlite',
    SQLITE_PATH: sqlitePath,
    JWT_SECRET: process.env.JWT_SECRET || 'desktop-local-secret',
    FEATURE_WEIGHT: 'true',
    TARGET: 'desktop',
  }

  console.log('[desktop] starting backend:', backendEntry)
  console.log('[desktop] sqlite path:', sqlitePath)

  backend = spawn(process.execPath, [backendEntry], {
    cwd: backendCwd,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  backend.stdout?.on('data', (d) => process.stdout.write(`[backend] ${d}`))
  backend.stderr?.on('data', (d) => process.stderr.write(`[backend ERR] ${d}`))
  backend.on('exit', (code) => {
    console.log('[desktop] backend exited with code', code)
    backend = null
  })

  return waitForBackend(30_000)
}

function waitForBackend(timeoutMs: number): Promise<void> {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(
        { host: BACKEND_HOST, port: BACKEND_PORT, path: '/api/v1/health', timeout: 1000 },
        (res) => {
          res.resume()
          if (res.statusCode === 200) return resolve()
          retry()
        },
      )
      req.on('error', retry)
      req.on('timeout', () => {
        req.destroy()
        retry()
      })
    }
    const retry = () => {
      if (Date.now() - start > timeoutMs) {
        return reject(new Error(`backend 啟動逾時（${timeoutMs}ms）`))
      }
      setTimeout(tick, 500)
    }
    tick()
  })
}

function createWindow() {
  const { adminIndex } = resolvePaths()

  if (!fs.existsSync(adminIndex)) {
    throw new Error(`admin 入口不存在：${adminIndex}\n請先 build admin (pnpm --filter @t-erp/admin build)`)
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 600,
    title: 'T-ERP',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.loadFile(adminIndex)

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

async function bootstrap() {
  try {
    await startBackend()
    createWindow()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[desktop] bootstrap failed:', message)
    dialog.showErrorBox('啟動失敗', message)
    app.quit()
  }
}

app.whenReady().then(bootstrap)

function killBackend() {
  if (!backend) return
  // SIGTERM 給 NestJS 機會優雅關閉；500ms 後若還在就 SIGKILL
  backend.kill('SIGTERM')
  const child = backend
  setTimeout(() => {
    try {
      child.kill('SIGKILL')
    } catch {}
  }, 500).unref()
  backend = null
}

app.on('window-all-closed', () => {
  killBackend()
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', killBackend)
process.on('exit', killBackend)
process.on('SIGINT', () => app.quit())
process.on('SIGTERM', () => app.quit())

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
