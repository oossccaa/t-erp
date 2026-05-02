#!/usr/bin/env bash
# T-ERP 線上更新腳本
# 用法：在 VPS 上 cd /opt/t-erp && bash scripts/deploy-update.sh
set -euo pipefail

cd "$(dirname "$0")/.."

BRANCH="${1:-develop}"

echo "▶ 拉最新 code (branch: $BRANCH)"
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

echo "▶ 備份目前 DB（更新前快照，怕新版有 migration 炸資料）"
bash scripts/backup.sh pre-update

echo "▶ 重新 build + 重啟 backend / admin（postgres 不重啟避免斷線）"
docker compose -f docker-compose.prod.yml build backend admin
docker compose -f docker-compose.prod.yml up -d backend admin caddy

echo "▶ 等 backend healthy（最多 60 秒）"
for i in {1..30}; do
  if docker compose -f docker-compose.prod.yml ps backend | grep -q "healthy"; then
    echo "✅ backend healthy"
    break
  fi
  sleep 2
done

echo "▶ 清舊 image"
docker image prune -f

echo
echo "✅ 更新完成"
docker compose -f docker-compose.prod.yml ps
