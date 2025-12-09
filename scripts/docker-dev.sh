#!/bin/bash
set -e

# T-ERP 開發環境管理腳本
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 輔助函數
print_header() {
    echo -e "${BLUE}===========================================${NC}"
    echo -e "${BLUE} $1 ${NC}"
    echo -e "${BLUE}===========================================${NC}"
}

print_info() {
    echo -e "${GREEN}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 檢查依賴
check_dependencies() {
    print_header "檢查環境依賴"
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安裝，請先安裝 Docker"
        exit 1
    fi
    
    if ! command -v docker compose &> /dev/null && ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose 未安裝，請先安裝 Docker Compose"
        exit 1
    fi
    
    print_info "✅ Docker: $(docker --version)"
    print_info "✅ Docker Compose: $(docker compose version 2>/dev/null || docker-compose --version)"
}

# 啟動開發環境
start_dev() {
    print_header "啟動 T-ERP 開發環境"
    
    print_info "創建開發環境網絡和數據卷..."
    docker compose -f docker-compose.dev.yml up -d
    
    print_info "等待服務啟動..."
    sleep 10
    
    print_info "檢查服務狀態..."
    docker compose -f docker-compose.dev.yml ps
    
    echo ""
    print_info "🎉 開發環境已啟動！"
    echo ""
    echo "🔗 服務訪問地址:"
    echo "   - PostgreSQL: localhost:5432"
    echo "   - Redis: localhost:6379"
    echo "   - pgAdmin: http://localhost:8080 (admin@t-erp.local / admin123)"
    echo "   - Redis Commander: http://localhost:8081"
    echo ""
    echo "📝 數據庫連接信息:"
    echo "   - 主機: localhost"
    echo "   - 端口: 5432"
    echo "   - 數據庫: t_erp_dev"
    echo "   - 用戶名: postgres"
    echo "   - 密碼: postgres123"
}

# 停止開發環境
stop_dev() {
    print_header "停止 T-ERP 開發環境"
    
    docker compose -f docker-compose.dev.yml down
    print_info "✅ 開發環境已停止"
}

# 重啟開發環境
restart_dev() {
    print_header "重啟 T-ERP 開發環境"
    
    docker compose -f docker-compose.dev.yml restart
    print_info "✅ 開發環境已重啟"
}

# 查看日誌
logs_dev() {
    print_header "查看開發環境日誌"
    
    if [ -n "$1" ]; then
        docker compose -f docker-compose.dev.yml logs -f "$1"
    else
        docker compose -f docker-compose.dev.yml logs -f
    fi
}

# 清理開發環境
clean_dev() {
    print_header "清理 T-ERP 開發環境"
    
    print_warning "這將刪除所有開發環境的容器、網絡和數據卷！"
    read -p "確定要繼續嗎？ (y/N) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker compose -f docker-compose.dev.yml down -v --remove-orphans
        docker system prune -f
        print_info "✅ 開發環境已清理"
    else
        print_info "取消清理操作"
    fi
}

# 備份開發數據
backup_dev() {
    print_header "備份開發環境數據"
    
    BACKUP_DIR="./backups/dev"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    
    mkdir -p "$BACKUP_DIR"
    
    print_info "備份 PostgreSQL 數據..."
    docker compose -f docker-compose.dev.yml exec -T postgres-dev pg_dump -U postgres t_erp_dev > "$BACKUP_DIR/postgres_$TIMESTAMP.sql"
    
    print_info "備份 Redis 數據..."
    docker compose -f docker-compose.dev.yml exec -T redis-dev redis-cli --no-auth-warning -a redis123 save
    docker cp t-erp-redis-dev:/data/dump.rdb "$BACKUP_DIR/redis_$TIMESTAMP.rdb"
    
    print_info "✅ 數據備份完成: $BACKUP_DIR/"
}

# 恢復開發數據
restore_dev() {
    if [ -z "$1" ]; then
        print_error "請指定備份文件名（不含路徑和擴展名）"
        echo "例如: ./scripts/docker-dev.sh restore 20240101_120000"
        exit 1
    fi
    
    print_header "恢復開發環境數據"
    
    BACKUP_DIR="./backups/dev"
    BACKUP_NAME="$1"
    
    if [ -f "$BACKUP_DIR/postgres_$BACKUP_NAME.sql" ]; then
        print_info "恢復 PostgreSQL 數據..."
        docker compose -f docker-compose.dev.yml exec -T postgres-dev psql -U postgres -d t_erp_dev < "$BACKUP_DIR/postgres_$BACKUP_NAME.sql"
    fi
    
    if [ -f "$BACKUP_DIR/redis_$BACKUP_NAME.rdb" ]; then
        print_info "恢復 Redis 數據..."
        docker compose -f docker-compose.dev.yml stop redis-dev
        docker cp "$BACKUP_DIR/redis_$BACKUP_NAME.rdb" t-erp-redis-dev:/data/dump.rdb
        docker compose -f docker-compose.dev.yml start redis-dev
    fi
    
    print_info "✅ 數據恢復完成"
}

# 顯示幫助信息
show_help() {
    echo "T-ERP 開發環境管理腳本"
    echo ""
    echo "用法: $0 <命令> [選項]"
    echo ""
    echo "命令:"
    echo "  start     啟動開發環境"
    echo "  stop      停止開發環境"
    echo "  restart   重啟開發環境"
    echo "  logs      查看日誌 [服務名]"
    echo "  clean     清理開發環境（刪除數據）"
    echo "  backup    備份開發環境數據"
    echo "  restore   恢復開發環境數據 <備份名>"
    echo "  help      顯示此幫助信息"
    echo ""
    echo "示例:"
    echo "  $0 start                    # 啟動開發環境"
    echo "  $0 logs postgres-dev        # 查看 PostgreSQL 日誌"
    echo "  $0 backup                   # 備份數據"
    echo "  $0 restore 20240101_120000  # 恢復指定備份"
}

# 主邏輯
case "$1" in
    start)
        check_dependencies
        start_dev
        ;;
    stop)
        stop_dev
        ;;
    restart)
        restart_dev
        ;;
    logs)
        logs_dev "$2"
        ;;
    clean)
        clean_dev
        ;;
    backup)
        backup_dev
        ;;
    restore)
        restore_dev "$2"
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "未知命令: $1"
        echo ""
        show_help
        exit 1
        ;;
esac