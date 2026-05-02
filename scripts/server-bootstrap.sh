#!/usr/bin/env bash
# T-ERP VPS 第一次啟動腳本
# 用途：在乾淨的 Ubuntu 24.04 VPS 上裝好所有依賴
# 用法：scp 上 server 後 sudo bash server-bootstrap.sh
set -euo pipefail

echo "▶ 更新 apt + 升級套件"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq

echo "▶ 安裝基本工具"
apt-get install -y -qq curl ca-certificates gnupg lsb-release ufw fail2ban git

echo "▶ 安裝 Docker（官方源）"
if ! command -v docker &> /dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
    gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

echo "▶ 防火牆（只開 22 / 80 / 443）"
ufw --force reset >/dev/null
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw --force enable
ufw status verbose

echo "▶ fail2ban 啟動（擋 SSH 暴力破解）"
systemctl enable --now fail2ban
systemctl restart fail2ban

echo "▶ swap 確認"
free -h | grep -E "Mem|Swap"

echo "▶ 建立 t-erp 部署目錄 /opt/t-erp"
mkdir -p /opt/t-erp /opt/backups

echo
echo "✅ Bootstrap 完成"
echo "下一步："
echo "  cd /opt/t-erp"
echo "  git clone <repo-url> ."
echo "  cp .env.production.example .env"
echo "  # 編輯 .env 填好密碼 / domain / CORS_ORIGIN"
echo "  docker compose -f docker-compose.prod.yml up -d --build"
