# T-ERP Docker 容器化部署

這個專案包含完整的 Docker 容器化配置，支援開發和生產環境的一鍵部署。

## 🏗 架構概覽

```
┌─────────────────────────────────────────────────────────────┐
│                        Nginx (反向代理)                        │
│                         Port: 80, 443                        │
└─────────────────┬─────────────────┬─────────────────────────┘
                  │                 │
        ┌─────────▼──────────┐   ┌──▼────────────────┐
        │   Admin Frontend   │   │  Client Frontend  │
        │    (Vue.js SPA)    │   │   (Vue.js SPA)    │
        │     Port: 3001     │   │    Port: 3002     │
        └─────────┬──────────┘   └──┬────────────────┘
                  │                 │
                  └─────────┬───────┘
                            │
                    ┌───────▼──────────┐
                    │   Backend API    │
                    │   (NestJS)       │
                    │   Port: 3000     │
                    └───────┬──────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
    ┌─────────▼──────────┐  │  ┌──────────▼────────────┐
    │   PostgreSQL 15    │  │  │      Redis 7         │
    │   Port: 5432       │  │  │    Port: 6379        │
    │                    │  │  │                      │
    │ - 主資料庫         │  │  │ - 會話存儲           │
    │ - 自動初始化       │  │  │ - 緩存服務           │
    │ - 數據持久化       │  │  │ - 隊列處理           │
    └────────────────────┘  │  └─────────────────────┘
                            │
                    ┌───────▼──────────┐
                    │  File Storage    │
                    │  (Docker Volume) │
                    │                  │
                    │ - 上傳文件       │
                    │ - 日誌文件       │
                    └──────────────────┘
```

## 🚀 快速開始

### 開發環境

```bash
# 1. 克隆專案
git clone <repository-url>
cd t-erp

# 2. 啟動開發環境（只包含資料庫和工具）
./scripts/docker-dev.sh start

# 3. 本地運行應用
pnpm install
pnpm dev

# 開發工具訪問地址:
# - pgAdmin: http://localhost:8080
# - Redis Commander: http://localhost:8081
```

### 生產環境

```bash
# 1. 設置環境變數
cp .env.production .env
nano .env  # 修改密碼和密鑰

# 2. 一鍵部署
./scripts/deploy.sh deploy

# 3. 驗證部署
curl http://localhost/health
```

## 📁 檔案結構

```
t-erp/
├── docker-compose.yml          # 生產環境配置
├── docker-compose.dev.yml      # 開發環境配置
├── Dockerfile                  # 多階段構建配置
├── .env.production             # 生產環境變數模板
│
├── docker/                     # Docker 配置文件
│   ├── nginx/                  # Nginx 配置
│   │   ├── Dockerfile
│   │   ├── nginx.conf          # 主配置
│   │   ├── admin.conf          # Admin 應用配置
│   │   ├── client.conf         # Client 應用配置
│   │   └── conf.d/
│   │       └── default.conf    # 代理配置
│   │
│   ├── postgres/               # PostgreSQL 配置
│   │   └── init/
│   │       └── 01-init.sql     # 初始化腳本
│   │
│   └── redis/                  # Redis 配置
│       └── redis.conf          # 生產環境配置
│
├── scripts/                    # 部署腳本
│   ├── docker-build.sh         # 構建腳本
│   ├── docker-dev.sh          # 開發環境管理
│   └── deploy.sh               # 生產部署腳本
│
└── docs/
    └── DOCKER_DEPLOYMENT.md    # 詳細部署文檔
```

## 🔧 服務配置

### Backend API (NestJS)
- **框架**: NestJS + TypeScript
- **資料庫**: PostgreSQL with TypeORM
- **緩存**: Redis
- **認證**: JWT + Session
- **API**: RESTful + OpenAPI

### Admin Frontend (Vue.js)
- **框架**: Vue 3 + TypeScript
- **UI 庫**: Element Plus
- **狀態管理**: Pinia
- **路由**: Vue Router
- **構建**: Vite

### Client Frontend (Vue.js)
- **框架**: Vue 3 + TypeScript
- **UI 庫**: Vant (移動端)
- **狀態管理**: Pinia
- **路由**: Vue Router
- **構建**: Vite

### Database (PostgreSQL)
- **版本**: PostgreSQL 15 Alpine
- **特性**: 
  - 自動初始化表結構
  - 數據持久化
  - 健康檢查
  - 備份支援

### Cache (Redis)
- **版本**: Redis 7 Alpine
- **配置**:
  - AOF + RDB 持久化
  - 密碼保護
  - 內存優化
  - 連接池

### Proxy (Nginx)
- **功能**:
  - 反向代理
  - 負載均衡
  - 靜態文件服務
  - SSL 終端
  - 速率限制
  - 安全標頭

## 🔒 安全特性

### 容器安全
- 非 root 用戶運行
- 最小權限原則
- 只暴露必要端口
- 健康檢查機制

### 網絡安全
- 內部網絡隔離
- 速率限制
- 安全標頭配置
- SSL/TLS 支援

### 數據安全
- 密碼哈希存儲
- JWT 令牌機制
- 數據加密傳輸
- 定期備份

## 📊 監控和維護

### 健康檢查
- 每個服務都配置了健康檢查
- 自動重啟失敗的容器
- 依賴關係管理

### 日誌管理
- 結構化日誌記錄
- 集中式日誌收集
- 日誌輪轉配置

### 備份策略
- 自動數據庫備份
- 文件系統備份
- 備份保留策略
- 一鍵恢復功能

## 🚨 故障排除

### 常用調試命令

```bash
# 查看服務狀態
docker compose ps

# 查看服務日誌
docker compose logs -f [服務名]

# 檢查服務健康狀態
docker compose exec backend curl -f http://localhost:3000/health

# 進入容器調試
docker compose exec postgres psql -U postgres -d t_erp

# 檢查網絡連通性
docker compose exec backend ping postgres
```

### 性能監控

```bash
# 查看資源使用
docker stats

# 查看磁碟使用
docker system df

# 清理無用資源
docker system prune -f
```

## 🔄 CI/CD 集成

這個配置支援以下 CI/CD 場景：

### GitHub Actions
```yaml
- name: Deploy to production
  run: |
    ./scripts/deploy.sh deploy
```

### 滾動更新
```bash
# 零停機時間更新
./scripts/deploy.sh update
```

### 自動備份
```bash
# 定時備份（可配置 cron）
./scripts/deploy.sh backup
```

## 📈 擴展性

### 水平擴展
- 支援多實例部署
- 負載均衡配置
- 數據庫連接池

### 垂直擴展
- 資源限制配置
- 性能調優參數
- 緩存策略優化

## 🔗 相關連結

- [詳細部署文檔](./docs/DOCKER_DEPLOYMENT.md)
- [開發環境設置](./docs/DEVELOPMENT.md)
- [API 文檔](./docs/API.md)
- [故障排除指南](./docs/TROUBLESHOOTING.md)

---

**注意**: 在生產環境部署前，請仔細閱讀 [詳細部署文檔](./docs/DOCKER_DEPLOYMENT.md) 並修改所有默認密碼和密鑰。