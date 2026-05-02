#!/usr/bin/env bash
# T-ERP DB 還原腳本
# 用法：bash scripts/restore.sh <備份檔.sql.gz>
# 例：bash scripts/restore.sh /opt/backups/t-erp-pre-update.sql.gz
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ $# -ne 1 ]]; then
  echo "用法：bash scripts/restore.sh <備份檔.sql.gz>"
  echo "可用備份："
  ls -lh /opt/backups/ 2>/dev/null || echo "  /opt/backups 不存在"
  exit 1
fi

FILE="$1"
if [[ ! -f "$FILE" ]]; then
  echo "❌ 找不到 $FILE"
  exit 1
fi

# shellcheck source=/dev/null
set -a; source .env; set +a

echo "⚠️  警告：這會覆蓋現有 DB 內容！"
echo "   檔案：$FILE"
echo "   目標：$DB_NAME @ postgres container"
read -p "   確定要繼續嗎？(yes/no) " -r
if [[ ! "$REPLY" =~ ^yes$ ]]; then
  echo "中止。"
  exit 0
fi

echo "▶ 還原中..."
gunzip -c "$FILE" | docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U "$DB_USER" -d "$DB_NAME"

echo "✅ 還原完成。建議重啟 backend："
echo "   docker compose -f docker-compose.prod.yml restart backend"
