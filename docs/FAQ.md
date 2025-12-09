# T-ERP 常見問題

## 🚀 安裝和部署

### Q: 系統最低硬體需求是什麼？

**A**: 建議配置：
- **CPU**: 2 核心以上
- **記憶體**: 4GB 以上 (開發環境 2GB)
- **硬碟空間**: 10GB 以上
- **網路**: 寬頻連線

### Q: 支援哪些作業系統？

**A**: T-ERP 支援以下作業系統：
- **Linux**: Ubuntu 20.04+, CentOS 8+, Debian 11+
- **macOS**: 10.15+
- **Windows**: 10/11 (使用 WSL2)

### Q: Docker 部署失敗怎麼辦？

**A**: 常見解決方案：

1. **檢查 Docker 版本**:
```bash
docker --version  # 需要 >= 20.0
docker-compose --version  # 需要 >= 2.0
```

2. **檢查端口衝突**:
```bash
lsof -i :80,443,3000,5432,6379
```

3. **清理 Docker 環境**:
```bash
docker system prune -a
docker volume prune
```

4. **檢查磁碟空間**:
```bash
df -h
```

### Q: 無法連接資料庫怎麼辦？

**A**: 檢查以下項目：

1. **確認 PostgreSQL 服務運行**:
```bash
# Docker 環境
docker ps | grep postgres

# 本地環境
sudo systemctl status postgresql
```

2. **檢查連接配置**:
```bash
# 檢查 .env 文件中的資料庫配置
cat .env | grep DB_
```

3. **測試資料庫連接**:
```bash
psql -h localhost -p 5432 -U postgres -d t_erp
```

## 🔐 認證和權限

### Q: 忘記管理員密碼怎麼辦？

**A**: 可通過以下方式重置：

1. **使用種子數據重置**:
```bash
pnpm --filter @t-erp/backend seed:run
```

2. **手動重置** (僅開發環境):
```bash
# 進入 PostgreSQL
psql -U postgres -d t_erp

# 更新管理員密碼 (password123)
UPDATE users SET password = '$2b$12$LQv3c1yqBwEHxPfGZ8qBu.1w9ElzzyW8tDcKgNOZmEwG1qdF6BTBC' WHERE username = 'admin';
```

### Q: JWT 令牌過期怎麼處理？

**A**: 系統提供自動刷新機制：

1. **前端自動處理**: 系統會自動使用 refresh token 更新 access token
2. **手動刷新**:
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "YOUR_REFRESH_TOKEN"}'
```

### Q: 如何自定義用戶權限？

**A**: 系統使用角色基礎權限控制 (RBAC)：

1. **內建角色**:
   - `admin`: 系統管理員 (所有權限)
   - `manager`: 部門經理 (大部分權限)
   - `user`: 一般用戶 (基本權限)

2. **修改權限**: 在 `src/modules/auth/guards/roles.guard.ts` 中自定義

## 📦 產品和庫存

### Q: 如何批量導入產品資料？

**A**: 目前支援以下方式：

1. **Excel 導入** (規劃中):
   - 準備 Excel 模板
   - 使用管理後台上傳功能

2. **API 批量創建**:
```bash
curl -X POST http://localhost:3000/api/products/batch \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[{"name": "產品1", "sku": "SKU001", ...}]'
```

### Q: 庫存數量不准確怎麼辦？

**A**: 建議處理步驟：

1. **檢查庫存移動記錄**:
```bash
curl -X GET "http://localhost:3000/api/inventory/movements?productId=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

2. **執行庫存盤點**:
   - 進入管理後台 → 庫存管理 → 庫存盤點
   - 輸入實際庫存數量
   - 系統會自動產生調整記錄

3. **檢查訂單狀態**: 確認所有訂單狀態正確更新

### Q: 低庫存預警不工作怎麼辦？

**A**: 檢查以下設定：

1. **環境變數設定**:
```bash
# 檢查預警閾值
echo $LOW_STOCK_THRESHOLD
```

2. **產品最低庫存設定**: 確認產品的 `minStock` 值已設定

3. **重啟服務**:
```bash
./scripts/deploy.sh restart
```

## 📋 訂單處理

### Q: 訂單狀態更新失敗怎麼辦？

**A**: 常見原因和解決方案：

1. **庫存不足**:
   - 檢查產品庫存數量
   - 確認是否有預留庫存

2. **權限問題**:
   - 確認用戶有訂單管理權限
   - 檢查用戶角色設定

3. **訂單狀態邏輯**:
   - 確認狀態轉換符合業務邏輯
   - 例如：pending → confirmed → processing → shipped

### Q: 如何自定義訂單編號格式？

**A**: 修改 `src/modules/orders/orders.service.ts`：

```typescript
private generateOrderNumber(type: string): string {
  const prefix = type === 'sales' ? 'SO' : 'PO'
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const sequence = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${prefix}-${date}-${sequence}`
}
```

## 🖥 前端使用

### Q: 網頁載入緩慢怎麼辦？

**A**: 優化建議：

1. **清除瀏覽器快取**: Ctrl+F5 或 Cmd+Shift+R

2. **檢查網路狀況**: 確認後端 API 服務正常

3. **開發環境優化**:
```bash
# 啟用生產模式
NODE_ENV=production pnpm dev
```

### Q: 上傳檔案失敗怎麼辦？

**A**: 檢查以下設定：

1. **檔案大小限制**:
```bash
# 檢查環境變數
echo $MAX_FILE_SIZE  # 預設 10MB
```

2. **檔案類型限制**:
```bash
echo $ALLOWED_FILE_TYPES
```

3. **上傳目錄權限**:
```bash
chmod 755 uploads/
```

### Q: 列印報表格式異常怎麼辦？

**A**: 建議解決方案：

1. **使用 Chrome 瀏覽器**: 獲得最佳列印效果

2. **調整列印設定**:
   - 選擇 A4 紙張
   - 啟用背景圖形
   - 調整邊距

3. **PDF 導出**: 使用瀏覽器的 "另存為 PDF" 功能

## 🔧 系統維護

### Q: 如何備份資料？

**A**: 提供多種備份方式：

1. **自動備份** (生產環境):
```bash
# 檢查備份設定
echo $BACKUP_ENABLED
echo $BACKUP_SCHEDULE
```

2. **手動備份**:
```bash
# 資料庫備份
pg_dump -U postgres -h localhost t_erp > backup_$(date +%Y%m%d).sql

# 檔案備份
tar -czf files_backup_$(date +%Y%m%d).tar.gz uploads/
```

3. **Docker 環境備份**:
```bash
./scripts/backup.sh create
```

### Q: 如何監控系統性能？

**A**: 使用內建監控功能：

1. **健康檢查**:
```bash
curl http://localhost:3000/api/health
```

2. **系統資訊**:
```bash
curl http://localhost:3000/api/info
```

3. **日誌檢查**:
```bash
# Docker 環境
docker logs t-erp-backend

# 本地環境
tail -f logs/app.log
```

### Q: 如何更新系統版本？

**A**: 更新步驟：

1. **備份資料**:
```bash
./scripts/backup.sh create
```

2. **拉取新版本**:
```bash
git pull origin main
```

3. **更新依賴**:
```bash
pnpm install
```

4. **資料庫遷移**:
```bash
pnpm --filter @t-erp/backend migration:run
```

5. **重啟服務**:
```bash
./scripts/deploy.sh restart
```

## 🌐 API 和整合

### Q: API 請求失敗怎麼辦？

**A**: 故障排除步驟：

1. **檢查 API 狀態**:
```bash
curl -I http://localhost:3000/api/health
```

2. **驗證認證令牌**:
```bash
# 解析 JWT 令牌
echo "YOUR_JWT_TOKEN" | cut -d. -f2 | base64 -d
```

3. **檢查請求格式**:
   - Content-Type: application/json
   - Authorization: Bearer TOKEN
   - 正確的 HTTP 方法

4. **查看錯誤日誌**:
```bash
docker logs t-erp-backend | grep ERROR
```

### Q: 如何整合第三方系統？

**A**: 整合方案：

1. **API 整合**: 使用 RESTful API 進行數據交換

2. **Webhook**: 設定事件通知機制

3. **Excel 導入/導出**: 批量數據交換

4. **自定義連接器**: 開發專用整合模組

## 📱 移動端使用

### Q: 手機瀏覽器無法正常顯示？

**A**: 確認以下項目：

1. **瀏覽器兼容性**: 使用 Chrome, Safari, Firefox 最新版本

2. **視窗大小**: 確認響應式設計正常載入

3. **JavaScript 支援**: 啟用 JavaScript 功能

### Q: 觸控操作不靈敏怎麼辦？

**A**: 建議解決方案：

1. **清除瀏覽器快取**

2. **重新載入頁面**

3. **檢查設備記憶體**: 關閉其他應用程式

## 🛠 開發相關

### Q: 開發環境啟動失敗？

**A**: 常見問題解決：

1. **Node.js 版本**:
```bash
node --version  # 需要 >= 18.0.0
```

2. **依賴安裝**:
```bash
rm -rf node_modules
pnpm install
```

3. **端口衝突**:
```bash
# 檢查端口使用狀況
lsof -i :3000,3001,3002
```

### Q: 如何添加新功能？

**A**: 開發步驟：

1. **創建功能分支**:
```bash
git checkout -b feature/new-feature
```

2. **後端開發**:
   - 創建實體 (Entity)
   - 創建 DTO
   - 創建服務 (Service)
   - 創建控制器 (Controller)

3. **前端開發**:
   - 創建 API 接口
   - 創建頁面組件
   - 添加路由
   - 更新狀態管理

4. **測試和文檔**:
   - 編寫單元測試
   - 更新 API 文檔
   - 測試功能完整性

## 📞 獲取更多幫助

### 技術支援管道

1. **文檔資源**:
   - [完整文檔](../README.md)
   - [開發指南](./DEVELOPMENT.md)
   - [API 文檔](./API.md)

2. **社群支援**:
   - [GitHub Issues](https://github.com/your-org/t-erp/issues)
   - [討論區](https://github.com/your-org/t-erp/discussions)

3. **商業支援**:
   - 📧 **Email**: support@t-erp.com
   - 📞 **電話**: +886-2-xxxx-xxxx
   - 💬 **線上客服**: 週一至週五 9:00-18:00

### 問題回報格式

提交問題時請提供以下資訊：

```
**環境資訊**:
- 作業系統: 
- Node.js 版本: 
- 瀏覽器: 
- T-ERP 版本: 

**問題描述**:
[詳細描述遇到的問題]

**重現步驟**:
1. 
2. 
3. 

**預期結果**:
[描述預期的正確行為]

**實際結果**:
[描述實際發生的情況]

**錯誤日誌**:
[貼上相關的錯誤訊息或日誌]

**截圖** (如適用):
[附上相關截圖]
```

---

**找不到答案？** 請查閱 [完整文檔](../README.md) 或 [提交問題](https://github.com/your-org/t-erp/issues/new)。