#!/bin/bash
set -e

# T-ERP Docker 構建腳本
echo "🚀 開始構建 T-ERP Docker 鏡像..."

# 顯示當前版本信息
echo "📋 系統信息:"
echo "   - Docker: $(docker --version)"
echo "   - Docker Compose: $(docker compose version 2>/dev/null || docker-compose --version)"
echo "   - Node.js: $(node --version 2>/dev/null || echo 'Node.js not found')"
echo "   - pnpm: $(pnpm --version 2>/dev/null || echo 'pnpm not found')"

# 設置環境變數
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# 清理之前的構建緩存 (可選)
if [ "$1" = "--clean" ]; then
    echo "🧹 清理 Docker 緩存..."
    docker builder prune -f
    docker system prune -f --volumes
fi

# 構建所有服務
echo "🔨 構建應用鏡像..."

echo "   └─ 構建 Backend API..."
docker build \
    --target backend-runtime \
    --tag t-erp/backend:latest \
    --tag t-erp/backend:$(date +%Y%m%d-%H%M%S) \
    --build-arg NODE_ENV=production \
    .

echo "   └─ 構建 Admin 前端..."
docker build \
    --target admin-runtime \
    --tag t-erp/admin:latest \
    --tag t-erp/admin:$(date +%Y%m%d-%H%M%S) \
    .

echo "   └─ 構建 Client 前端..."
docker build \
    --target client-runtime \
    --tag t-erp/client:latest \
    --tag t-erp/client:$(date +%Y%m%d-%H%M%S) \
    .

# 構建 Nginx 代理
echo "   └─ 構建 Nginx 代理..."
docker build \
    --tag t-erp/nginx:latest \
    --tag t-erp/nginx:$(date +%Y%m%d-%H%M%S) \
    ./docker/nginx/

# 顯示構建結果
echo ""
echo "✅ 構建完成! 生成的鏡像:"
docker images | grep "t-erp/"

echo ""
echo "📝 接下來的步驟:"
echo "   1. 複製 .env.production 並修改配置: cp .env.production .env"
echo "   2. 啟動服務: docker compose up -d"
echo "   3. 查看服務狀態: docker compose ps"
echo "   4. 查看日誌: docker compose logs -f"

echo ""
echo "🔗 服務訪問地址:"
echo "   - 主網站: http://localhost"
echo "   - 管理後台: http://localhost/admin"
echo "   - API 文檔: http://localhost/api/docs (如果啟用)"