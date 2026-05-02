# T-ERP 進銷存系統 — `cloud` 分支

> **這個分支只含雲端版**（NestJS + Vue3 + PostgreSQL + Docker）
> 桌機 Electron 版在 [`desktop` 分支](https://github.com/oossccaa/t-erp/tree/desktop)
> 兩個分支獨立運作，安裝任一邊不會影響另一邊

小工廠進銷存系統，雲端版部署到 VPS，給多人 Web 瀏覽器使用。

> **目標客戶：** 小型製造業、零件貿易商、傳產工廠
> **架構模式：** Monorepo (pnpm + turbo)
> **後端：** NestJS + TypeORM + PostgreSQL
> **前端：** Vue 3 + Element Plus + Vite
> **部署：** Docker Compose + Caddy（auto SSL）

---

## 🚀 快速開始

### 共通需求
- Node.js **18+**
- pnpm **10+**
- macOS / Linux / Windows

### 第一次安裝

```bash
git clone <repo>
cd t-erp
pnpm install
```

> 若安裝完要立即跑桌機版，需要對齊 native module ABI（自動會跑 postinstall，但偶爾失敗）：
> ```bash
> pnpm --filter @t-erp/desktop rebuild-natives
> ```

---

## 📦 兩種運行模式

### 模式 A：雲端版（瀏覽器 + PostgreSQL）

需要 Docker 跑 PostgreSQL：

```bash
# 第一次：起 PostgreSQL container
docker compose -f docker-compose.dev.yml up -d

# 啟動全端開發伺服器
pnpm dev               # 預設 t_erp_dev DB
pnpm dev:demo          # 切到 t_erp_demo DB
pnpm dev:sqlite        # 後端用 SQLite（桌機 schema 但跑在瀏覽器）
```

開啟 `http://localhost:3001`，登入 `admin / admin123`。

**正式 build：**

```bash
pnpm build:cloud       # 含 weight feature 的 cloud build
```

### 模式 B：桌機版（Electron + 本地 SQLite）

```bash
# 開發模式（本地 source 直接跑 Electron）
pnpm desktop:dev

# Build + 啟動（不打包 dmg，直接從 source 啟）
pnpm desktop:build
pnpm desktop:start

# 打包成 dmg（macOS arm64）
pnpm desktop:package
# 產出於 apps/desktop/release/T-ERP-X.Y.Z-arm64.dmg
```

**桌機版的本地資料：** `~/Library/Application Support/@t-erp/desktop/t-erp.db`
- 第一次啟動會自動 seed `admin / admin123`
- 整個 SQLite DB 是單檔，可備份 / 搬遷

---

## 🏗️ 系統架構

```
┌─────────────────────────────────────────────────────────────┐
│                      apps/admin (Vue 3)                      │
│  共用前端 — vite build 產出 SPA                              │
│  - cloud：vite dev server / nginx 部署                       │
│  - desktop：build 後被 Electron loadFile() 載入              │
└──────────────┬─────────────────────────────────────┬─────────┘
               │ /api/v1                             │ /api/v1
               ▼                                     ▼
┌─────────────────────────────┐         ┌─────────────────────────────┐
│   apps/backend (NestJS)     │         │   apps/backend (NestJS)     │
│   cloud 模式                │         │   desktop 模式               │
│   ─────────────────────     │         │   ─────────────────────     │
│   listen :3000              │         │   listen :3939 (本機)       │
│   DB_TYPE=postgres          │         │   DB_TYPE=sqlite            │
│                             │         │   SQLITE_PATH=userData/...  │
└─────────────┬───────────────┘         └──────────┬──────────────────┘
              ▼                                    ▼
   ┌──────────────────┐                 ┌──────────────────┐
   │   PostgreSQL     │                 │   SQLite (file)  │
   │   (Docker)       │                 │   ~/Library/...  │
   └──────────────────┘                 └──────────────────┘

           ┌──────────────────────────────────────────┐
           │   apps/desktop (Electron)                │
           │   - main process: 啟動 backend 子行程    │
           │   - 載入 admin/dist/index.html via       │
           │     file:// protocol                     │
           │   - single-instance lock                 │
           │   - SIGTERM cleanup of backend           │
           └──────────────────────────────────────────┘
```

### 三個 app

| Path | 用途 |
|---|---|
| `apps/backend/` | NestJS REST API，所有商業邏輯 |
| `apps/admin/` | Vue 3 SPA，瀏覽器/Electron 共用 |
| `apps/desktop/` | Electron 殼，spawn backend + load admin |

### 關鍵檔案

- [apps/backend/src/config/database.config.ts](apps/backend/src/config/database.config.ts) — 依 `DB_TYPE` 切 PG / SQLite
- [apps/backend/src/config/features.config.ts](apps/backend/src/config/features.config.ts) — backend feature flags
- [apps/admin/src/config/features.ts](apps/admin/src/config/features.ts) — frontend feature flags（vite build 時固化）
- [apps/desktop/src/main.ts](apps/desktop/src/main.ts) — Electron main process
- [apps/desktop/scripts/build.js](apps/desktop/scripts/build.js) — 桌機完整打包流程
- [apps/desktop/scripts/rebuild-natives.js](apps/desktop/scripts/rebuild-natives.js) — 對齊 better-sqlite3 ABI

### Feature flags

由環境變數驅動，支援單一 codebase 出多種版本：

| 變數 | 值 | 用途 |
|---|---|---|
| `FEATURE_WEIGHT` / `VITE_FEATURE_WEIGHT` | `true`/`false` | 產品重量欄位 + 訂單即時總重量計算 |
| `TARGET` / `VITE_TARGET` | `cloud`/`desktop` | 影響 router mode（hash for desktop）等 |
| `DB_TYPE` | `postgres`/`sqlite` | 後端資料庫方言 |

---

## 🔧 常用指令

```bash
# 監控所有 app 的開發伺服器
pnpm dev

# 全部 typecheck
pnpm typecheck

# 全部 lint
pnpm lint

# 跑後端單元測試
pnpm test

# 桌機版打包流程（建 backend → admin → desktop → deploy → 對齊 native ABI）
pnpm desktop:build

# 桌機版 dmg
pnpm desktop:package

# 開發中對齊 native ABI（手動）
pnpm --filter @t-erp/desktop rebuild-natives
```

---

## 🗄️ 預設帳號

任何模式都會在第一次啟動（DB users 表為空時）自動 seed：

```
帳號：admin
密碼：admin123
```

**部署到正式環境前請改密碼**（在管理介面或直接改 DB）。

---

## 🐛 疑難排解

### 桌機版啟動「backend 連線逾時」

通常是 native module 未對齊 Electron 的 Node ABI。手動跑：

```bash
pnpm --filter @t-erp/desktop rebuild-natives
pnpm desktop:build
```

### 雲端版啟動「Cannot connect to PostgreSQL」

Docker daemon 沒跑：

```bash
open -a Docker
# 等鯨魚 icon 變綠
docker compose -f docker-compose.dev.yml up -d
```

### `data type "datetime" not supported by postgres`

`@Column` 不要寫 `type:`，讓 TypeORM 依 dialect 自選（PG → timestamp，SQLite → datetime）。

### Electron 打包後啟動疑似 fork bomb

兩道保險已內建（[apps/desktop/src/main.ts](apps/desktop/src/main.ts:11)）：
- `requestSingleInstanceLock()`：第二個 instance 自殺
- spawn backend 時 `ELECTRON_RUN_AS_NODE: '1'`：強制 child 跑 Node 模式

如果還是看到多個 process，回報 issue。

---

## 📜 LICENSE

私有專案，請勿外流。
