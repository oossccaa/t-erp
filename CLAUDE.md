# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

小工廠進銷存系統 - 基於 NestJS + Vue3 + MySQL 的 monorepo 進銷存管理系統，支援響應式設計。

**專案類型**: 全端 Web 應用程式  
**架構模式**: Monorepo  
**套件管理器**: pnpm  

## 技術棧配置

### 後端 (NestJS)
- **框架**: NestJS + TypeScript
- **資料庫**: MySQL 8.0 + TypeORM
- **認證**: JWT + Passport
- **快取**: Redis (可選)
- **API 文件**: Swagger/OpenAPI

### 前端 (Vue3)
- **框架**: Vue3 + TypeScript + Composition API
- **管理後台**: Element Plus UI 庫
- **行動客戶端**: Vant UI 庫  
- **狀態管理**: Pinia
- **路由**: Vue Router
- **建置工具**: Vite

### 開發工具
- **程式碼檢查**: ESLint
- **格式化**: Prettier  
- **測試**: Jest (後端) + Vitest (前端)
- **打包工具**: Vite

## 專案結構

```
apps/
├── backend/         # NestJS API 服務 (port 3000)
├── admin/          # 管理後台 (port 3001) 
└── client/         # 行動客戶端 (port 3002)

packages/
├── shared/         # 共享 TypeScript 類型、常數、工具
└── ui/            # 共享 Vue3 元件和設計 tokens
```

## 開發環境需求

- **Node.js**: 18+
- **套件管理器**: pnpm@8+
- **資料庫**: MySQL 8.0 (port 3306)
- **快取**: Redis 7.0 (port 6379, 可選)

### 環境變數檔案
- `.env.local` (最高優先級)
- `.env.development` 
- `.env.production`

## 常用開發指令

### 根目錄層級
```bash
# 啟動所有應用程式 (開發模式)
pnpm dev

# 建置所有應用程式
pnpm build

# 執行所有套件測試
pnpm test

# 執行端到端測試  
pnpm test:e2e

# 程式碼檢查
pnpm lint

# 修復 linting 問題
pnpm lint:fix

# 所有套件的型別檢查
pnpm typecheck

# Prettier 格式化程式碼
pnpm format

# 清理建置產物
pnpm clean
```

### 後端專用指令 (apps/backend/)
```bash
# 啟動開發伺服器 (熱重載)
pnpm dev

# 建置正式版
pnpm build

# 單元測試
pnpm test

# 測試覆蓋率
pnpm test:cov

# 端到端測試
pnpm test:e2e

# 僅型別檢查
pnpm typecheck
```

### 前端應用程式 (apps/admin/ 或 apps/client/)
```bash
# 啟動開發伺服器
pnpm dev

# 建置正式版
pnpm build

# 單元測試
pnpm test

# 測試 UI 介面
pnpm test:ui

# 僅型別檢查
pnpm typecheck
```

## 核心業務實體

- **User (用戶)**: 用戶認證和權限管理
- **Product (產品)**: 產品目錄和庫存管理
- **Category (分類)**: 產品分類階層
- **Supplier (供應商)**: 供應商關係管理
- **Customer (客戶)**: 客戶關係管理
- **PurchaseOrder (進貨單)**: 採購訂單管理
- **SaleOrder (銷貨單)**: 銷售訂單管理  
- **Inventory (庫存)**: 即時庫存追蹤
- **InventoryTransaction (庫存異動)**: 庫存異動記錄

## API 設計原則

### REST 規範
- 使用標準 HTTP 動詞 (GET, POST, PUT, DELETE)
- 使用複數名詞作為資源路徑 (`/api/products`)
- 使用嵌套路徑表示關聯 (`/api/orders/1/items`)
- 統一錯誤回應格式

### 回應格式
**成功回應:**
```json
{
  "success": true,
  "data": {...},
  "message": "操作成功"
}
```

**錯誤回應:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "驗證失敗",
    "details": [...]
  }
}
```

## 資料庫設計原則

### 命名規範
- **資料表**: snake_case (`user_profiles`)
- **欄位**: snake_case (`created_at`)
- **索引**: `idx_table_column` (`idx_users_email`)

### 設計慣例
- 每個資料表都有 `id` (主鍵), `created_at`, `updated_at`
- 使用軟刪除 (`deleted_at`) 而不是硬刪除
- 外鍵命名格式: `{referenced_table}_id`
- 布爾欄位使用 `is_` 前綴

### 預設資料庫資訊
- **資料庫**: `t_erp_dev`
- **用戶**: `t_erp` / 密碼: `t_erp123`  
- **Root 密碼**: `password123`
- **預設管理員**: `admin` / 密碼: `admin123`

## 前端開發規範

### 元件結構
- 使用 Composition API
- Props 使用 TypeScript 介面定義
- Emit 事件明確定義型別
- 使用 `<script setup>` 語法

### 響應式設計斷點
- **手機**: 768px
- **平板**: 1024px  
- **桌機**: 1200px

### 效能優化
- 使用動態導入進行程式碼分割
- 圖片使用 lazy loading
- 長列表使用虛擬捲動
- 適當使用 keep-alive 快取元件

## 程式碼規範

### 命名慣例
- **檔案**: kebab-case (`user-service.ts`)
- **類別**: PascalCase (`UserService`)
- **函數**: camelCase (`getUserById`)
- **常數**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)

### 導入偏好
- 使用絕對路徑導入 (`@/components/...`)
- 按類型分組導入 (第三方庫 > 本地模組 > 型別)
- 優先使用具名導入而不是預設導入

### 程式碼風格
- 使用一致的縮排 (2 spaces)
- 行長度限制 100 字元
- 函數盡量保持簡潔 (< 50 行)
- 類別和介面新增 JSDoc 註解

## 測試策略

### 後端測試
- **單元測試**: 對所有 service 和 utility 函數編寫單元測試
- **整合測試**: 對 API 端點編寫整合測試
- **端到端測試**: 對關鍵業務流程編寫端到端測試

### 前端測試
- **單元測試**: 對 utility 函數和 composables 編寫單元測試
- **元件測試**: 對重要元件編寫元件測試
- **端到端測試**: 對用戶關鍵操作流程編寫端到端測試

## 安全考量

### 認證機制
- 使用 JWT token 進行認證
- 實作 refresh token 機制
- 密碼使用 bcrypt 加密

### 權限控制
- 基於角色的權限控制 (RBAC)
- API 端點權限驗證  
- 前端路由守衛

### 資料驗證
- 後端使用 class-validator 驗證
- 前端使用 schema 驗證
- SQL 注入防護
- XSS 攻擊防護

## 容器化部署

### 開發環境
```bash
# 啟動資料庫和服務
docker-compose -f docker-compose.dev.yml up -d

# 安裝相依套件
pnpm install

# 啟動所有應用程式
pnpm dev
```

### 正式環境
- 使用 multi-stage Docker builds
- `backend-runtime`: NestJS 應用伺服器
- `admin-runtime`: 靜態檔案由 nginx 提供
- `client-runtime`: 行動應用程式由 nginx 提供

## 常見問題排除

### CORS 錯誤
檢查 NestJS CORS 配置，確保前端網域名在白名單中

### 資料庫連接失敗  
檢查 `.env` 中的資料庫配置，確保 MySQL 服務已啟動

### TypeScript 編譯錯誤
檢查 `tsconfig.json` 配置，確保路徑別名設定正確

### Pnpm workspace 相依問題
使用 `pnpm install --shamefully-hoist` 解決相依套件提升問題

## Claude Code 開發偏好

### 程式碼品質
- 優先考慮程式碼可讀性和維護性
- 新增適當的註解，特別是業務邏輯部分
- 錯誤處理要完整且用戶友好
- 考慮邊緣情況和異常處理
- 生成的程式碼要包含基本的型別定義

### 應該避免
- 不要使用已棄用的 API
- 避免過度複雜的抽象
- 不要忽略錯誤處理
- 避免硬編碼配置值

### 效能優化建議

**後端:**
- 資料庫查詢使用索引
- 實作分頁查詢
- 使用 Redis 快取熱點資料
- API 回應進行 gzip 壓縮

**前端:**
- 使用 CDN 載入靜態資源
- 實作 service worker 離線快取
- 圖片格式優化 (WebP)
- 使用 Tree Shaking 減少套件大小