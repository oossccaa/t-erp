# 桌面版測試 SOP

> 給自己 / 客戶試裝重複用。直接照步驟跑就好，每段最後都有「成功長怎樣」。

跨平台：Mac 跟 Windows 指令並列。挑你的系統那條跑就好。

---

## 0. 前置（只裝一次）

| | Mac | Windows |
|---|---|---|
| Git | `xcode-select --install` 自帶；或 brew | https://git-scm.com/download/win |
| Node 20 LTS | `brew install node@20` 或從 nodejs.org | https://nodejs.org/（裝 LTS） |
| pnpm | `npm install -g pnpm` | 同左（cmd / PowerShell） |

驗證：
```bash
node -v   # 應該 v20.x
pnpm -v   # 應該 10.x
git --version
```

---

## 1. 全新環境第一次測試（Clean Install）

### 1-1. Clone 桌面版分支

**Mac (Terminal) / Windows (cmd 或 PowerShell)**：
```bash
git clone -b desktop https://github.com/oossccaa/t-erp.git
cd t-erp
```

### 1-2. 安裝依賴

```bash
pnpm install
```

> 第一次會比較慢（5-10 分鐘）：
> - 抓 Electron Chromium binary（~100MB）
> - postinstall 自動對齊 better-sqlite3 ABI 給 Electron Node 20
>
> **失敗的話**手動跑一次：
> ```bash
> pnpm --filter @t-erp/desktop rebuild-natives
> ```

**成功長相：**
```
Done in 5m 30s using pnpm v10.33.0
```
而且 `apps/desktop/node_modules/electron/dist/` 底下有 `Electron.app`（Mac）或 `electron.exe`（Win）。

### 1-3. 開發模式跑跑看

```bash
pnpm desktop:dev
```

**第一次跑**會自動 build backend → admin → desktop 三邊（log 會印出三段「=== ... 開始建 ===」），花 1-2 分鐘。
**之後再跑**只會重 build desktop main（10 秒），快很多。

**成功長相：**
1. terminal 印出
   ```
   [desktop] starting backend: .../apps/backend/dist/main.js
   [desktop] sqlite path: <userData>/t-erp.db
   [backend] 🚀 Application is running on: http://localhost:3939
   ```
2. **跳出 T-ERP 視窗**
3. 看到登入畫面

### 1-4. 第一次登入

```
帳號：admin
密碼：admin123
```

**成功長相：** 進到 dashboard，左側選單有「儀表板 / 產品 / 庫存 / 進貨 / 銷貨 / 客戶 / 供應商」等。

---

## 2. 功能 smoke test（第一次裝完跑一次就好）

照順序跑，每步都驗證能 work：

### 2-1. 建分類
左側 **產品分類** → 右上「新增分類」→ 輸入「測試分類」→ 儲存

✓ 列表出現「測試分類」

### 2-2. 建產品
左側 **產品管理** → 右上「新增產品」→
- SKU: `TEST-001`
- 名稱：測試產品
- 售價：100
- 成本：80
- 初始庫存：50
- 最低庫存：5
- 分類：測試分類
- （桌面版**不會看到重量欄位**，這是預期）

✓ 列表出現「測試產品」，分類顯示「測試分類」

### 2-3. 建供應商
左側 **供應商管理** → 新增 → 隨便填名稱「測試供應商」→ 儲存

### 2-4. 建客戶
左側 **客戶管理** → 新增 → 隨便填名稱「測試客戶」→ 儲存

### 2-5. 開進貨單
左側 **進貨單** → 新增 → 選**測試供應商** → 加項目 → 選 TEST-001 → 數量 10 → 單價 80 → 儲存

✓ 訂單列表多一筆，狀態 = 草稿

### 2-6. 收貨
進貨單列表 → 那筆訂單操作欄「收貨」按鈕 → 點開後輸入收貨 10 件（或點「全部收貨」）→ 確認

✓ 庫存從 50 → 60（產品管理頁可看）

### 2-7. 開銷貨單 + 出貨
左側 **銷貨單** → 新增 → 選測試客戶 → 加 TEST-001 數量 5 → 儲存 → 「出貨」

✓ 庫存從 60 → 55

### 2-8. 標記付款
進貨單 / 銷貨單列表的操作欄 →「標記已付款」→ 確認 → 付款狀態 tag 變綠

### 2-9. 重啟 app 確認資料留著
關閉 app → `pnpm desktop:dev` 再開 → 資料都還在（SQLite 持久化）

---

## 3. 平常迭代測試（不需要每次重 install）

```bash
# 1. 拉最新 code
git pull

# 2. 啟動（會自動 detect 需不需要重 build）
pnpm desktop:dev
```

**改了 backend code**：刪掉 `apps/backend/dist/`，再 `pnpm desktop:dev` 就會重 build backend
**改了 admin code**：刪掉 `apps/admin/dist/`，再 `pnpm desktop:dev` 就會重 build admin
**改了 desktop main.ts**：每次 `pnpm desktop:dev` 都會自動 tsc

**Mac 砍 dist：**
```bash
rm -rf apps/backend/dist apps/admin/dist
```

**Windows 砍 dist (cmd)：**
```cmd
rmdir /s /q apps\backend\dist
rmdir /s /q apps\admin\dist
```

**Windows 砍 dist (PowerShell)：**
```powershell
Remove-Item -Recurse -Force apps\backend\dist, apps\admin\dist
```

---

## 4. 重置到「乾淨 admin 帳號」狀態（demo 給客戶看之前）

桌面版資料是本地 SQLite，砍掉就會自動重 seed：

| | Mac | Windows |
|---|---|---|
| 資料路徑 | `~/Library/Application Support/@t-erp/desktop/` | `%APPDATA%\@t-erp\desktop\` |
| 砍掉指令 | `rm -rf "$HOME/Library/Application Support/@t-erp"` | `rmdir /s /q "%APPDATA%\@t-erp"` |

下次 `pnpm desktop:dev` 啟動會：
- 重新建空 SQLite
- 自動 seed `admin / admin123`

---

## 5. 完整打包（給人試裝）

### Mac arm64 (Apple Silicon)
```bash
pnpm desktop:build
pnpm --filter @t-erp/desktop package:mac
# 產出: apps/desktop/release/T-ERP-X.Y.Z-arm64.dmg
```

### Windows x64
```cmd
pnpm desktop:build
pnpm --filter @t-erp/desktop package:win
:: 產出: apps\desktop\release\T-ERP Setup X.Y.Z.exe (NSIS installer)
```

### 試裝
- **Mac**：雙擊 dmg → 拖 .app 到 Applications → 從 Launchpad 開
- **Windows**：雙擊 .exe → SmartScreen 警告點「其他資訊 → 仍要執行」→ 安裝精靈

裝完跑一次「2. 功能 smoke test」確認 packaged 版本一樣 work。

---

## 6. 常見錯誤對照表

| 錯誤訊息 | 原因 | 解法 |
|---|---|---|
| `Electron failed to install correctly` | pnpm 沒跑 install hook | `pnpm install` 重來；root package.json 已加 electron 到白名單 |
| `Cannot find module typescript/bin/tsc` | tsc 在 Windows 找不到 | 已修，`git pull` 即可（用 pnpm exec 取代 npx） |
| `backend 入口不存在 .../dist/main.js` | backend 還沒 build | 已自動 build；或手動 `pnpm --filter @t-erp/backend build` |
| `node-gyp` 失敗 / Visual Studio not found | better-sqlite3 prebuilt 抓不到，要 fallback 到本地 build | 裝 Visual Studio Build Tools 2022 含「使用 C++ 的桌面開發」 |
| 視窗閃一下就消失 | backend 子行程沒起來，看不到 log | 不要點 `start`，改 `pnpm desktop:dev > dev.log 2>&1` 把 log 抓下來看 |
| 開出視窗但是空白 | admin SPA assets 路徑錯 | 已用 `--base ./` 解決，不該再出現 |
| 登入後 404 | router 用 history 模式但 file:// 不支援 | 已用 hash mode 解決 |
| 「Windows 已保護您的電腦」| 未簽章 SmartScreen 警告 | 點「其他資訊 → 仍要執行」（要免警告需 EV cert ~$300/年） |
| Electron 視窗開兩個 / fork bomb | spawn 沒帶 ELECTRON_RUN_AS_NODE | 已修+ single-instance lock 雙重保險 |

---

## 7. 完全砍掉重來

只有「我懷疑這台機器一切都壞掉」時才用：

| | Mac | Windows |
|---|---|---|
| 砍 node_modules | `rm -rf node_modules apps/*/node_modules` | `rmdir /s /q node_modules` 一個一個目錄砍 |
| 砍 dist | `rm -rf apps/*/dist apps/desktop/build-resources` | 同上 |
| 砍本地資料 | `rm -rf "$HOME/Library/Application Support/@t-erp"` | `rmdir /s /q "%APPDATA%\@t-erp"` |
| 重裝 | `pnpm install` | 同左 |
| 重 build + run | `pnpm desktop:dev` | 同左 |

這樣可以做到比 fresh clone 還乾淨（lockfile 也重抓）。

---

## 附錄：cheatsheet

```bash
# 第一次裝
pnpm install

# 跑
pnpm desktop:dev

# 打包
pnpm desktop:build && pnpm --filter @t-erp/desktop package:mac    # 或 :win

# 還原 admin/admin123
rm -rf "$HOME/Library/Application Support/@t-erp"   # Mac
rmdir /s /q "%APPDATA%\@t-erp"                       # Windows

# 強制重 build 全部
rm -rf apps/*/dist                                    # Mac
:: Windows 一個一個砍
```
