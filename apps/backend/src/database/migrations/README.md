# 資料庫 Migration 指南

## 概述

本專案使用 TypeORM Migration 來管理資料庫結構變更，確保資料庫版本的可追溯性和可維護性。

## Migration 腳本

在 `package.json` 中已配置以下 migration 相關腳本：

```bash
# 自動生成 migration（比較 entity 與資料庫差異）
pnpm migration:generate src/database/migrations/MigrationName

# 手動創建空白 migration
pnpm migration:create src/database/migrations/MigrationName

# 執行待執行的 migrations
pnpm migration:run

# 回滾最後一次執行的 migration
pnpm migration:revert

# 顯示所有 migrations 的狀態
pnpm migration:show
```

## 使用方式

### 1. 在開發環境使用 Migration（推薦）

**步驟 1：修改 database.config.ts**

將 `synchronize` 設為 `false`：

```typescript
synchronize: false, // 使用 migration 管理資料庫結構
```

**步驟 2：執行 Migration**

```bash
cd apps/backend
pnpm migration:run
```

**步驟 3：驗證**

檢查資料庫表結構，確認新欄位已添加：
- `purchase_orders.cancelReason`
- `purchase_orders.cancelledAt`
- `purchase_orders.cancelledById`
- `purchase_orders.statusHistory`
- `sale_orders.cancelReason`
- `sale_orders.cancelledAt`
- `sale_orders.cancelledById`
- `sale_orders.statusHistory`

### 2. 使用自動同步（當前配置）

如果保持 `synchronize: true`（開發環境預設），TypeORM 會在應用啟動時自動同步 entity 變更到資料庫，無需手動執行 migration。

但**強烈建議在生產環境使用 migration**，避免意外的資料庫結構變更。

### 3. 在生產環境部署

**步驟 1：關閉自動同步**

確保生產環境的 `synchronize` 為 `false`。

**步驟 2：執行 Migration**

在部署流程中加入：

```bash
# 構建應用
pnpm build

# 執行 migration
pnpm migration:run

# 啟動應用
pnpm start:prod
```

## 現有 Migrations

### 1704470400000-AddOrderCancellationFields.ts

**目的**：為進貨單和銷貨單添加取消和狀態追蹤功能

**新增欄位**：
- `cancelReason` (varchar 500): 取消原因
- `cancelledAt` (timestamp): 取消時間
- `cancelledById` (int): 取消操作者 ID（外鍵關聯 users.id）
- `statusHistory` (jsonb): 狀態變更歷史記錄

**影響表**：
- `purchase_orders`
- `sale_orders`

**回滾**：
```bash
pnpm migration:revert
```

## 注意事項

### 環境變數

Migration 會使用以下環境變數連接資料庫：

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres123
DB_NAME=t_erp
```

確保在執行 migration 前已正確配置 `.env` 檔案。

### Migration 命名規範

- 時間戳格式：`{timestamp}-{Description}.ts`
- 描述使用 PascalCase
- 例如：`1704470400000-AddOrderCancellationFields.ts`

### 資料安全

- 執行 migration 前建議先備份資料庫
- 在測試環境驗證 migration 後再部署到生產環境
- 回滾操作可能導致資料丟失，請謹慎使用

### TypeORM CLI

本專案使用 `typeorm-ts-node-commonjs` 命令來運行 migration，這是為了支援 TypeScript 和 CommonJS 模組系統。

## 常見問題

**Q: 我應該使用 synchronize 還是 migration？**

A:
- 開發環境：可使用 `synchronize: true` 快速迭代
- 生產環境：**必須**使用 migration（`synchronize: false`）

**Q: Migration 失敗怎麼辦？**

A:
1. 檢查資料庫連接配置
2. 確認資料庫用戶有足夠權限
3. 查看錯誤訊息，可能是資料衝突或約束問題
4. 必要時手動修復資料後重新執行

**Q: 如何創建新的 migration？**

A:
```bash
# 方法 1：自動生成（比較 entity 和資料庫差異）
pnpm migration:generate src/database/migrations/YourMigrationName

# 方法 2：手動創建空白模板
pnpm migration:create src/database/migrations/YourMigrationName
```

**Q: 可以跳過某個 migration 嗎？**

A: 不建議。如果確實需要，可以：
1. 手動在 `migrations` 表中插入該 migration 記錄
2. 或者刪除該 migration 檔案（會影響其他環境）

## 相關資源

- [TypeORM Migrations 官方文檔](https://typeorm.io/migrations)
- [TypeORM DataSource API](https://typeorm.io/data-source)
