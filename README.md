# T-ERP 進銷存系統 — `desktop` 分支

> **這個分支只含桌機版**（Electron + NestJS + 本地 SQLite）
> 雲端 SaaS 版在 [`cloud` 分支](https://github.com/oossccaa/t-erp/tree/cloud)
> 兩個分支獨立運作，安裝任一邊不會影響另一邊

小工廠進銷存系統，**Electron 桌機 app**，資料存本地 SQLite，使用者單機操作。

> **目標客戶：** 小型工廠（單機 1-3 個用戶）
> **架構模式：** Monorepo (pnpm + turbo)
> **後端：** NestJS（Electron child process 啟動）
> **前端：** Vue 3 + Element Plus，Electron renderer
> **資料：** 本地 SQLite（`~/Library/Application Support/@t-erp/desktop/t-erp.db`）

---

## 🚀 快速開始

### 共通需求
- **Node.js 18+**（建議 20）
- **pnpm 10+**（`npm install -g pnpm`）
- **Git**

### 平台特殊需求

**Windows：**
- Visual Studio Build Tools 2019/2022（含「使用 C++ 的桌面開發」工作負載）
  → 只在 better-sqlite3 預編 binary 抓不到時 fallback 才需要，多數情況不會用到
- Python 3（如上同）

**macOS：**
- Xcode Command Line Tools（`xcode-select --install`）

### 第一次安裝（Mac / Windows / Linux 通用）

```bash
git clone -b desktop <repo-url>
cd t-erp
pnpm install
# postinstall 會自動對齊 better-sqlite3 native ABI 給 Electron 32 (Node 20)
# 失敗的話手動跑：
#   pnpm --filter @t-erp/desktop rebuild-natives
```

### 開發模式

```bash
pnpm desktop:dev
```

第一次啟動會自動 seed `admin / admin123`。

### 完整 Build + 啟動

```bash
# 完整 pipeline（backend → admin → desktop tsc → pnpm deploy → 對齊 native）
pnpm desktop:build

# 啟動已 build 好的版本（不打包安裝程式）
pnpm desktop:start
```

### 打包安裝程式

| 平台 | 指令 | 產出 |
|---|---|---|
| macOS arm64 | `pnpm --filter @t-erp/desktop package:mac` | `apps/desktop/release/T-ERP-*.dmg` |
| Windows x64 | `pnpm --filter @t-erp/desktop package:win` | `apps/desktop/release/T-ERP Setup *.exe`（NSIS installer） |
| Linux x64 | `pnpm --filter @t-erp/desktop package:linux` | `apps/desktop/release/*.AppImage` |

> 跨平台打包：electron-builder 在 Mac 上能打 Mac 但**不建議** cross-build Windows（簽章流程通常壞掉）。Windows installer 請在 Windows 機器跑 `package:win`。

### Windows 第一次跑可能遇到的事

1. **`pnpm install` 卡 better-sqlite3**：先試 `pnpm --filter @t-erp/desktop rebuild-natives`。如果還是失敗，就要裝 Visual Studio Build Tools。
2. **`desktop:dev` 黑窗閃一下就關**：通常是 backend 子行程沒起來。從 cmd 跑 `pnpm desktop:dev > dev.log 2>&1` 看 log。
3. **打包 .exe 後 Windows 防護警告「Windows 已保護您的電腦」**：未簽章導致的 SmartScreen 警告。點「其他資訊」→「仍要執行」即可（要免警告需買 EV cert ~$300/年）。

---

## 🏗️ 系統架構

```
                     T-ERP.app (Electron)
                  ┌─────────────────────────────┐
                  │  Main Process (main.ts)     │
                  │  - single-instance lock     │
                  │  - 啟動 backend 子行程       │
                  │  - 載入 admin/dist          │
                  └──────────┬──────────────────┘
                             │ spawn
              ┌──────────────▼──────────────┐
              │  Backend (NestJS, child)    │
              │  ELECTRON_RUN_AS_NODE=1     │
              │  listen 127.0.0.1:3939     │
              │  DB_TYPE=sqlite             │
              └──────────────┬──────────────┘
                             ▼
              ┌──────────────────────────────┐
              │  SQLite (single file)        │
              │  userData/t-erp.db           │
              └──────────────────────────────┘
                             ▲
                             │ /api/v1
              ┌──────────────┴──────────────┐
              │  Renderer (Vue 3 SPA)       │
              │  loadFile admin/dist        │
              │  hash router (file://)      │
              └─────────────────────────────┘
```

### 三個 app

| Path | 用途 |
|---|---|
| `apps/backend/` | NestJS API，跑在 Electron child process |
| `apps/admin/` | Vue 3 SPA，被 Electron 載入當 renderer |
| `apps/desktop/` | Electron 殼 + 打包流程 |

### 關鍵檔案

- [apps/desktop/src/main.ts](apps/desktop/src/main.ts) — Electron main process
- [apps/desktop/scripts/build.js](apps/desktop/scripts/build.js) — 完整打包 pipeline
- [apps/desktop/scripts/rebuild-natives.js](apps/desktop/scripts/rebuild-natives.js) — better-sqlite3 ABI 對齊
- [apps/backend/src/config/database.config.ts](apps/backend/src/config/database.config.ts) — DB_TYPE 切 PG/SQLite
- [apps/admin/src/config/features.ts](apps/admin/src/config/features.ts) — frontend feature flags

---

## 🐛 疑難排解

### 啟動「backend 連線逾時」

通常是 native module 沒對齊 Electron Node ABI：
```bash
pnpm --filter @t-erp/desktop rebuild-natives
pnpm desktop:build
```

### 打包後啟動 fork bomb

兩道保險已內建（[apps/desktop/src/main.ts](apps/desktop/src/main.ts)）：
- `requestSingleInstanceLock()` — 第二個 instance 自殺
- spawn backend 時 `ELECTRON_RUN_AS_NODE: '1'` — 強制 child 跑 Node 模式

### 重置桌機本地資料（dev 用）

```bash
rm -rf "$HOME/Library/Application Support/@t-erp"
```
下次啟動會重新 seed admin/admin123。

---

## 🗄️ 預設帳號

```
帳號：admin
密碼：admin123
```

第一次啟動時 backend 偵測到 users 表為空就會自動建立。**正式給客戶用前請改密碼**。

---

## 📜 LICENSE

私有專案，請勿外流。
