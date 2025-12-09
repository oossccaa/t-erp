# T-ERP Docker 容器化部署指南

這份文檔將指導您如何使用 Docker 容器化技術部署 T-ERP 系統。

## 📋 系統要求

### 最小要求
- **CPU**: 2 核心
- **RAM**: 4GB
- **磁碟空間**: 20GB
- **作業系統**: Linux (推薦 Ubuntu 20.04+), macOS, Windows 10+

### 推薦配置
- **CPU**: 4 核心或以上
- **RAM**: 8GB 或以上
- **磁碟空間**: 50GB 或以上
- **SSD** 儲存以獲得更好的性能

### 軟體要求
- Docker 20.10+
- Docker Compose 2.0+ (或 docker-compose 1.29+)
- Git

## 🚀 快速開始

### 1. 克隆專案
```bash
git clone <repository-url>
cd t-erp
```

### 2. 設定環境變數
```bash
# 複製環境變數模板
cp .env.production .env

# 編輯環境變數 (務必修改密碼和密鑰)
nano .env
```

### 3. 一鍵部署
```bash
# 使用部署腳本
./scripts/deploy.sh deploy

# 或手動執行
docker compose up -d
```

### 4. 驗證部署
- 訪問 http://localhost 檢查網站
- 訪問 http://localhost/admin 檢查管理後台
- 訪問 http://localhost/api/health 檢查 API 狀態

## 🛠 開發環境

### 啟動開發環境
```bash
# 使用開發腳本
./scripts/docker-dev.sh start

# 或手動執行
docker compose -f docker-compose.dev.yml up -d
```

### 開發服務
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **pgAdmin**: http://localhost:8080
- **Redis Commander**: http://localhost:8081

### 開發環境管理
```bash
# 查看服務狀態
./scripts/docker-dev.sh logs

# 備份開發數據
./scripts/docker-dev.sh backup

# 清理開發環境
./scripts/docker-dev.sh clean
```

## 🏭 生產環境部署

### 環境準備

1. **服務器配置**
```bash
# 更新系統
sudo apt update && sudo apt upgrade -y

# 安裝 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安裝 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

2. **防火牆設定**
```bash
# 開放必要端口
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

3. **安全配置**
```bash
# 創建應用用戶
sudo useradd -m -s /bin/bash t-erp
sudo usermod -aG docker t-erp

# 切換到應用用戶
sudo su - t-erp
```

### 部署步驟

1. **克隆專案並配置**
```bash
git clone <repository-url>
cd t-erp

# 設置環境變數
cp .env.production .env
nano .env  # 修改生產環境配置
```

2. **部署應用**
```bash
# 完整部署
./scripts/deploy.sh deploy

# 或者分步執行
./scripts/docker-build.sh        # 構建鏡像
docker compose up -d             # 啟動服務
```

3. **驗證部署**
```bash
# 檢查服務狀態
./scripts/deploy.sh check

# 查看服務日誌
docker compose logs -f
```

## 🔧 配置詳解

### 環境變數配置

| 變數名 | 說明 | 範例值 |
|--------|------|--------|
| `NODE_ENV` | 運行環境 | `production` |
| `DB_HOST` | 資料庫主機 | `postgres` |
| `DB_PASSWORD` | 資料庫密碼 | `secure_password_123` |
| `JWT_SECRET` | JWT 密鑰 | `your-secret-key-min-32-chars` |
| `REDIS_PASSWORD` | Redis 密碼 | `redis_password_123` |

### 服務配置

#### PostgreSQL
- **版本**: 15-alpine
- **端口**: 5432
- **數據卷**: `postgres_data`
- **配置**: 自動建表和初始數據

#### Redis
- **版本**: 7-alpine
- **端口**: 6379
- **持久化**: AOF + RDB
- **配置**: 生產環境優化

#### Nginx
- **功能**: 反向代理、負載均衡、靜態文件服務
- **安全**: 安全標頭、速率限制、SSL 支援
- **優化**: Gzip 壓縮、緩存控制

## 📊 監控和維護

### 健康檢查
```bash
# 檢查所有服務
docker compose ps

# 檢查資源使用
docker stats

# 查看服務日誌
docker compose logs -f [服務名]
```

### 備份和恢復
```bash
# 備份數據
./scripts/deploy.sh backup

# 恢復數據
./scripts/deploy.sh rollback 20240101_120000
```

### 更新部署
```bash
# 拉取最新代碼
git pull origin main

# 滾動更新
./scripts/deploy.sh update

# 或完整重新部署
./scripts/deploy.sh deploy
```

### 日誌管理
```bash
# 查看實時日誌
docker compose logs -f

# 查看特定服務日誌
docker compose logs -f backend

# 清理日誌
docker system prune -f
```

## 🔒 安全最佳實踐

### 1. 密碼和密鑰
- 使用強密碼（至少 16 字符）
- 定期輪換 JWT 密鑰
- 不要在代碼中硬編碼敏感信息

### 2. 網絡安全
- 使用防火牆限制端口訪問
- 配置 SSL/TLS 證書
- 啟用速率限制

### 3. 容器安全
- 使用非 root 用戶運行容器
- 定期更新基礎鏡像
- 掃描鏡像漏洞

### 4. 數據安全
- 定期備份數據
- 加密敏感數據
- 限制資料庫訪問權限

## 🚨 故障排除

### 常見問題

1. **服務啟動失敗**
```bash
# 檢查日誌
docker compose logs [服務名]

# 檢查配置
docker compose config

# 重新構建
docker compose build --no-cache
```

2. **數據庫連接失敗**
```bash
# 檢查 PostgreSQL 狀態
docker compose exec postgres pg_isready -U postgres

# 檢查網絡連通性
docker compose exec backend ping postgres
```

3. **內存不足**
```bash
# 檢查資源使用
docker stats

# 清理無用資源
docker system prune -f
```

4. **端口衝突**
```bash
# 檢查端口使用
ss -tlnp | grep :80

# 修改端口配置
nano docker-compose.yml
```

### 性能優化

1. **資料庫優化**
- 調整 PostgreSQL 配置
- 添加適當的索引
- 定期 VACUUM 和 ANALYZE

2. **Redis 優化**
- 配置內存驅逐策略
- 啟用持久化
- 監控內存使用

3. **應用優化**
- 啟用 Gzip 壓縮
- 配置靜態文件緩存
- 使用 CDN（可選）

## 📞 技術支持

如遇到部署問題，請：

1. 檢查本文檔的故障排除部分
2. 查看項目 Issue 區域
3. 提交詳細的錯誤日誌和環境信息

## 📚 參考資源

- [Docker 官方文檔](https://docs.docker.com/)
- [Docker Compose 文檔](https://docs.docker.com/compose/)
- [PostgreSQL 官方文檔](https://www.postgresql.org/docs/)
- [Redis 官方文檔](https://redis.io/docs/)
- [Nginx 官方文檔](https://nginx.org/en/docs/)

---

**注意**: 這是生產環境部署指南，請在部署前仔細閱讀並測試所有配置。