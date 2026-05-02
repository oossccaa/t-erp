#!/usr/bin/env bash
# T-ERP DB 備份腳本
# 用法：bash scripts/backup.sh [tag]
#   tag 預設為時間戳，可手動指定（例：pre-update）
# Cron 每日：
#   0 3 * * * cd /opt/t-erp && bash scripts/backup.sh daily >> /var/log/t-erp-backup.log 2>&1
set -euo pipefail

cd "$(dirname "$0")/.."

# 從 .env 讀 DB 設定
if [[ ! -f .env ]]; then
  echo "❌ 找不到 .env"
  exit 1
fi
# shellcheck source=/dev/null
set -a; source .env; set +a

BACKUP_DIR="${BACKUP_DIR:-/opt/backups}"
TAG="${1:-$(date +%Y%m%d-%H%M%S)}"
FILE="$BACKUP_DIR/t-erp-${TAG}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "▶ 備份到 $FILE"
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists \
  | gzip > "$FILE"

# 檢查檔案非空
if [[ ! -s "$FILE" ]]; then
  echo "❌ 備份檔是空的，可能 dump 失敗"
  exit 1
fi

SIZE=$(du -h "$FILE" | cut -f1)
echo "✅ 完成 ($SIZE)"

# 只留近 14 天的 daily 備份（其他 tag 不動）
echo "▶ 清舊備份（>14 天的 daily-*.sql.gz）"
find "$BACKUP_DIR" -name "t-erp-daily-*.sql.gz" -mtime +14 -delete -print || true

echo "▶ 目前所有備份："
ls -lh "$BACKUP_DIR"
