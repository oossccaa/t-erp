# T-ERP 企業資源規劃系統

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-supported-blue.svg)](https://www.docker.com/)

一個專為小型製造企業設計的現代化進銷存管理系統，提供完整的庫存管理、訂單處理、客戶關係管理等功能。

## 🌟 功能特色

### 📦 庫存管理
- **即時庫存追蹤** - 多倉庫、批次、序號管理
- **智能預警系統** - 庫存不足自動提醒
- **庫存調整** - 盤點、報廢、調撥等操作
- **成本核算** - FIFO/LIFO/加權平均等成本方法

### 📋 訂單管理
- **銷售訂單** - 從報價到出貨的完整流程
- **採購訂單** - 供應商管理與採購計劃
- **訂單追蹤** - 實時狀態更新與物流追蹤
- **自動化工作流** - 審批流程自動化

### 👥 客戶關係管理
- **客戶檔案管理** - 完整的客戶資訊記錄
- **價格管理** - 多級價格體系
- **信用額度控制** - 風險管控
- **交易歷史分析** - 客戶行為洞察

### 📊 報表分析
- **銷售分析** - 銷售趨勢、產品分析
- **庫存報表** - 庫存周轉、呆滯分析
- **財務報表** - 成本分析、毛利統計
- **自定義報表** - 靈活的報表製作工具

## 🏗 技術架構

### 前端技術棧
- **Vue 3** - 現代化前端框架
- **TypeScript** - 類型安全
- **Element Plus** - 管理後台 UI 組件庫
- **Vant** - 移動端 UI 組件庫
- **Pinia** - 狀態管理
- **Vite** - 快速構建工具

### 後端技術棧
- **NestJS** - 企業級 Node.js 框架
- **TypeScript** - 全棧類型安全
- **PostgreSQL** - 可靠的關係型資料庫
- **TypeORM** - 現代化 ORM
- **Redis** - 緩存與會話存儲
- **JWT** - 安全認證

### 部署方案
- **Docker** - 容器化部署
- **Nginx** - 反向代理與負載均衡
- **Docker Compose** - 服務編排
- **健康檢查** - 服務監控

## 🚀 快速開始

### 使用 Docker（推薦）

1. **克隆專案**
```bash
git clone https://github.com/oossccaa/t-erp.git
cd t-erp
```

2. **配置環境變數**
```bash
cp .env.example .env
# 編輯 .env 文件，修改密碼和密鑰
```

3. **一鍵啟動**
```bash
# 生產環境
./scripts/deploy.sh deploy

# 開發環境
./scripts/docker-dev.sh start
```

4. **訪問應用**
- 🌐 **網站首頁**: http://localhost
- 🔧 **管理後台**: http://localhost/admin
- 📱 **移動端**: http://localhost （響應式設計）
- 📚 **API 文檔**: http://localhost/api/docs

### 本地開發

1. **環境要求**
```bash
Node.js >= 18.0.0
PostgreSQL >= 15
Redis >= 7
pnpm >= 8.0.0
```

2. **安裝依賴**
```bash
pnpm install
```

3. **啟動資料庫**
```bash
# 使用 Docker 啟動開發資料庫
./scripts/docker-dev.sh start
```

4. **配置環境變數**
```bash
cp .env.development .env
```

5. **啟動應用**
```bash
# 啟動所有服務
pnpm dev

# 或分別啟動
pnpm --filter @t-erp/backend dev    # 後端 API
pnpm --filter @t-erp/admin dev      # 管理後台
pnpm --filter @t-erp/client dev     # 客戶端
```

## 📚 詳細文檔

- [📖 開發指南](./docs/DEVELOPMENT.md) - 完整的開發環境設置
- [🐋 Docker 部署指南](./docs/DOCKER_DEPLOYMENT.md) - 生產環境部署
- [🔧 API 文檔](./docs/API.md) - RESTful API 接口說明
- [❓ 常見問題](./docs/FAQ.md) - 疑難解答

## 🏃‍♂️ 快速導覽

### 默認帳號
```
管理員帳號: admin
密碼: admin123

演示帳號: demo  
密碼: demo123
```

### 核心功能流程

1. **商品管理**
   - 新增商品分類 → 建立商品檔案 → 設定庫存水位

2. **採購流程**
   - 建立供應商 → 建立採購訂單 → 驗收入庫 → 應付帳款

3. **銷售流程**
   - 建立客戶 → 建立銷售訂單 → 出貨作業 → 應收帳款

4. **庫存管理**
   - 庫存盤點 → 庫存調整 → 庫存預警 → 庫存報表

## 🔧 系統配置

### 環境變數配置

系統提供詳細的環境變數配置，支援：
- 🔐 安全設定（JWT、密碼策略）
- 🗄 資料庫連接設定
- 📧 郵件服務配置
- 📁 文件上傳限制
- 🚀 性能調優參數

### 業務參數配置

- **庫存預警閾值**: 可調整庫存不足提醒比例
- **訂單處理流程**: 支援自定義審批流程
- **價格精度**: 可設定小數位數
- **多幣別支援**: 支援多種貨幣

## 📊 系統監控

### 健康檢查
- `/health` - 系統健康狀態
- `/info` - 系統資訊
- 資料庫連接狀態
- 記憶體使用監控

### 日誌記錄
- 結構化日誌記錄
- 錯誤追蹤
- 操作審計日誌
- 性能監控

## 🔒 安全特性

- **認證與授權**: JWT + RBAC 權限控制
- **資料加密**: 密碼雜湊、傳輸加密
- **輸入驗證**: 全面的資料驗證機制
- **安全標頭**: Helmet 安全中間件
- **速率限制**: API 請求頻率控制

## 🤝 貢獻指南

我們歡迎各種形式的貢獻！

1. **提交 Issue** - 報告 Bug 或提出功能建議
2. **提交 Pull Request** - 代碼貢獻
3. **文檔改進** - 幫助完善文檔
4. **測試支援** - 提供測試用例

### 開發流程
1. Fork 專案
2. 創建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

## 📄 授權條款

本專案採用 MIT 授權條款。詳見 [LICENSE](LICENSE) 文件。

## 🆘 技術支援

遇到問題？我們提供多種支援管道：

- 💬 **GitHub Issues**: [提交問題](https://github.com/oossccaa/t-erp/issues)
- 📖 **文檔**: [查看文檔](./docs/)
- 💡 **FAQ**: [常見問題](./docs/FAQ.md)

## 🎯 專案路線圖

### v1.1 計劃功能
- [ ] 多語言支援
- [ ] 行動 APP
- [ ] 高級報表引擎
- [ ] 第三方整合 API

### v1.2 計劃功能
- [ ] 微服務架構
- [ ] 分散式部署
- [ ] 人工智能預測
- [ ] 區塊鏈溯源

---

<div align="center">

**[⭐ 給我們一個 Star](https://github.com/oossccaa/t-erp)** | **[📖 查看文檔](./docs/)** | **[🐋 Docker 部署](./docs/DOCKER_DEPLOYMENT.md)**

Made with ❤️ for small businesses

</div>