#!/bin/bash
set -e

# T-ERP 生產環境部署腳本
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
BACKUP_DIR="./backups/production"
LOG_DIR="./logs"

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

log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $1" >> "$LOG_DIR/deploy.log"
    echo "$1"
}

# 檢查系統要求
check_requirements() {
    print_header "檢查系統要求"
    
    # 檢查 Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安裝"
        exit 1
    fi
    
    # 檢查 Docker Compose
    if ! command -v docker compose &> /dev/null && ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose 未安裝"
        exit 1
    fi
    
    # 檢查系統資源
    local memory=$(free -m | awk 'NR==2{printf "%.0f", $2/1024}')
    if [ "$memory" -lt 2 ]; then
        print_warning "系統記憶體少於 2GB，可能影響性能"
    fi
    
    # 檢查磁碟空間
    local disk_space=$(df -BG / | awk 'NR==2{print $4}' | sed 's/G//')
    if [ "$disk_space" -lt 10 ]; then
        print_warning "磁碟可用空間少於 10GB，請確保有足夠空間"
    fi
    
    # 檢查網絡端口
    local ports=(80 443 5432 6379)
    for port in "${ports[@]}"; do
        if ss -tlnp | grep -q ":$port "; then
            print_warning "端口 $port 已被使用，可能會發生衝突"
        fi
    done
    
    print_info "✅ 系統檢查完成"
}

# 環境配置檢查
check_environment() {
    print_header "檢查環境配置"
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.production" ]; then
            print_info "複製生產環境配置..."
            cp .env.production .env
        else
            print_error "找不到環境配置文件 .env 或 .env.production"
            exit 1
        fi
    fi
    
    # 檢查關鍵配置
    source .env
    
    if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "your-super-secret-jwt-key-change-in-production" ]; then
        print_error "請在 .env 文件中設置安全的 JWT_SECRET"
        exit 1
    fi
    
    if [ -z "$DB_PASSWORD" ] || [ "$DB_PASSWORD" = "postgres123" ]; then
        print_warning "建議更改默認的數據庫密碼"
    fi
    
    print_info "✅ 環境配置檢查完成"
}

# 備份數據
backup_data() {
    print_header "備份生產數據"
    
    if ! docker compose ps | grep -q "Up"; then
        print_info "服務未運行，跳過備份"
        return
    fi
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    mkdir -p "$BACKUP_DIR"
    
    # 備份 PostgreSQL
    print_info "備份 PostgreSQL 數據..."
    docker compose exec -T postgres pg_dump -U postgres t_erp > "$BACKUP_DIR/postgres_$timestamp.sql"
    
    # 備份 Redis
    print_info "備份 Redis 數據..."
    docker compose exec -T redis redis-cli --no-auth-warning -a "$REDIS_PASSWORD" save
    docker cp t-erp-postgres:/data/dump.rdb "$BACKUP_DIR/redis_$timestamp.rdb" 2>/dev/null || true
    
    # 備份上傳文件
    if [ -d "./uploads" ]; then
        print_info "備份上傳文件..."
        tar -czf "$BACKUP_DIR/uploads_$timestamp.tar.gz" uploads/
    fi
    
    # 清理舊備份（保留最新 7 個）
    find "$BACKUP_DIR" -name "*.sql" -type f -printf '%T@ %p\n' | sort -n | head -n -7 | cut -d' ' -f2- | xargs -r rm
    find "$BACKUP_DIR" -name "*.rdb" -type f -printf '%T@ %p\n' | sort -n | head -n -7 | cut -d' ' -f2- | xargs -r rm
    find "$BACKUP_DIR" -name "*.tar.gz" -type f -printf '%T@ %p\n' | sort -n | head -n -7 | cut -d' ' -f2- | xargs -r rm
    
    print_info "✅ 數據備份完成: $BACKUP_DIR/"
}

# 構建應用
build_app() {
    print_header "構建應用鏡像"
    
    export DOCKER_BUILDKIT=1
    export COMPOSE_DOCKER_CLI_BUILD=1
    
    # 清理舊鏡像
    docker system prune -f
    
    # 構建鏡像
    print_info "構建應用鏡像..."
    docker compose build --no-cache --parallel
    
    print_info "✅ 應用構建完成"
}

# 部署應用
deploy_app() {
    print_header "部署應用服務"
    
    # 停止舊服務
    print_info "停止舊服務..."
    docker compose down --remove-orphans
    
    # 啟動新服務
    print_info "啟動新服務..."
    docker compose up -d
    
    # 等待服務啟動
    print_info "等待服務啟動..."
    sleep 30
    
    # 檢查服務狀態
    check_services
}

# 檢查服務狀態
check_services() {
    print_header "檢查服務狀態"
    
    local services=("postgres" "redis" "backend" "admin" "client" "nginx")
    local all_healthy=true
    
    for service in "${services[@]}"; do
        local status=$(docker compose ps -q "$service" | xargs docker inspect -f '{{.State.Health.Status}}' 2>/dev/null || echo "no-healthcheck")
        
        if [ "$status" = "healthy" ] || [ "$status" = "no-healthcheck" ]; then
            print_info "✅ $service: 運行正常"
        else
            print_error "❌ $service: $status"
            all_healthy=false
        fi
    done
    
    if [ "$all_healthy" = true ]; then
        print_info "🎉 所有服務運行正常！"
        show_service_urls
    else
        print_error "部分服務異常，請檢查日誌"
        print_info "查看日誌: docker compose logs [服務名]"
        exit 1
    fi
}

# 顯示服務訪問地址
show_service_urls() {
    print_header "服務訪問地址"
    
    echo "🔗 主要服務:"
    echo "   - 網站首頁: http://localhost"
    echo "   - 管理後台: http://localhost/admin"
    echo "   - API 端點: http://localhost/api"
    echo ""
    echo "🔧 管理工具:"
    echo "   - 健康檢查: http://localhost/health"
    echo ""
    echo "📊 監控命令:"
    echo "   - 查看狀態: docker compose ps"
    echo "   - 查看日誌: docker compose logs -f [服務名]"
    echo "   - 查看資源: docker stats"
}

# 滾動更新
rolling_update() {
    print_header "執行滾動更新"
    
    local services=("backend" "admin" "client")
    
    for service in "${services[@]}"; do
        print_info "更新 $service 服務..."
        
        # 構建新鏡像
        docker compose build "$service"
        
        # 滾動更新
        docker compose up -d --no-deps "$service"
        
        # 等待服務穩定
        sleep 10
        
        # 檢查服務健康狀態
        local health_check_count=0
        while [ $health_check_count -lt 30 ]; do
            local status=$(docker compose ps -q "$service" | xargs docker inspect -f '{{.State.Health.Status}}' 2>/dev/null || echo "no-healthcheck")
            
            if [ "$status" = "healthy" ] || [ "$status" = "no-healthcheck" ]; then
                print_info "✅ $service 更新成功"
                break
            fi
            
            print_info "等待 $service 服務健康檢查..."
            sleep 2
            health_check_count=$((health_check_count + 1))
        done
        
        if [ $health_check_count -ge 30 ]; then
            print_error "❌ $service 更新失敗，服務異常"
            # 回滾到之前的版本
            docker compose restart "$service"
            exit 1
        fi
    done
    
    print_info "🎉 滾動更新完成！"
}

# 完整部署
full_deploy() {
    mkdir -p "$LOG_DIR" "$BACKUP_DIR"
    
    log "開始完整部署..."
    
    check_requirements
    check_environment
    backup_data
    build_app
    deploy_app
    
    log "完整部署完成！"
}

# 快速部署（跳過構建）
quick_deploy() {
    print_header "快速部署（使用現有鏡像）"
    
    check_environment
    backup_data
    
    print_info "重啟服務..."
    docker compose down
    docker compose up -d
    
    sleep 20
    check_services
}

# 回滾到指定備份
rollback() {
    if [ -z "$1" ]; then
        print_error "請指定要回滾的備份時間戳"
        echo "可用的備份:"
        ls -1 "$BACKUP_DIR" | grep postgres_ | sed 's/postgres_//' | sed 's/.sql//'
        exit 1
    fi
    
    print_header "回滾到備份: $1"
    
    local backup_name="$1"
    
    # 停止服務
    docker compose down
    
    # 恢復數據
    print_info "恢復數據庫..."
    docker compose up -d postgres redis
    sleep 10
    
    if [ -f "$BACKUP_DIR/postgres_$backup_name.sql" ]; then
        docker compose exec -T postgres psql -U postgres -d t_erp < "$BACKUP_DIR/postgres_$backup_name.sql"
    else
        print_error "找不到數據庫備份文件: $BACKUP_DIR/postgres_$backup_name.sql"
        exit 1
    fi
    
    # 恢復文件
    if [ -f "$BACKUP_DIR/uploads_$backup_name.tar.gz" ]; then
        print_info "恢復上傳文件..."
        rm -rf uploads/
        tar -xzf "$BACKUP_DIR/uploads_$backup_name.tar.gz"
    fi
    
    # 重啟所有服務
    docker compose up -d
    
    print_info "✅ 回滾完成"
}

# 顯示幫助信息
show_help() {
    echo "T-ERP 生產環境部署腳本"
    echo ""
    echo "用法: $0 <命令> [選項]"
    echo ""
    echo "命令:"
    echo "  deploy      完整部署（包含構建）"
    echo "  quick       快速部署（跳過構建）"
    echo "  update      滾動更新"
    echo "  check       檢查服務狀態"
    echo "  backup      備份生產數據"
    echo "  rollback    回滾到指定備份 <時間戳>"
    echo "  logs        查看服務日誌"
    echo "  help        顯示此幫助信息"
    echo ""
    echo "示例:"
    echo "  $0 deploy                   # 完整部署"
    echo "  $0 quick                    # 快速重啟"
    echo "  $0 rollback 20240101_120000 # 回滾到指定備份"
    echo "  $0 logs backend             # 查看後端日誌"
}

# 主邏輯
case "$1" in
    deploy)
        full_deploy
        ;;
    quick)
        quick_deploy
        ;;
    update)
        rolling_update
        ;;
    check)
        check_services
        ;;
    backup)
        backup_data
        ;;
    rollback)
        rollback "$2"
        ;;
    logs)
        docker compose logs -f "${2:-}"
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