# T-ERP 雲端部署指南

針對 Vultr / DigitalOcean / Linode 等 VPS（Ubuntu 24.04）的單機 docker compose 部署。

> **如果你只要看每日操作（更新 / 備份 / 重啟）**，跳到 [日常維護](#日常維護)。

---

## 部署目標

```
Vultr / DO / Linode VPS (Ubuntu 24.04)
└── /opt/t-erp/
    ├── docker-compose.prod.yml
    ├── .env                  # 機密設定（不進 git）
    ├── Caddyfile
    └── 4 個 docker container：
        ├── postgres   :5432  (內網 only)
        ├── backend    :3000  (內網 only)
        ├── admin      :80    (內網 only)
        └── caddy      :80, :443 (公開，含 Let's Encrypt SSL)
```

預設 4GB RAM / 2 vCPU 月費 ~$24，給 5-10 個同時使用者足夠。

---

## 第一次部署（從零到能登入）

### 1. 開好 VPS

- Ubuntu **24.04 LTS** x64
- **4GB RAM 以上**（2GB 會 build OOM，除非加 swap）
- 開放 22 / 80 / 443 port

### 2. 把你的 SSH 公鑰加到 server

VPS 開好之後 console 會給你 IP。Mac 上：

```bash
# 看你的公鑰
cat ~/.ssh/id_rsa.pub

# 第一次連線
ssh root@<VPS-IP>
```

### 3. 跑 bootstrap 安裝 docker + ufw + fail2ban

在 VPS 上：

```bash
# 拉 repo
mkdir -p /opt/t-erp && cd /opt/t-erp
git clone -b develop https://github.com/<your-org>/t-erp.git .

# 跑 bootstrap（一次性）
sudo bash scripts/server-bootstrap.sh
```

bootstrap 會做：
- `apt update && upgrade`
- 裝 Docker CE + compose plugin
- 啟用 ufw 防火牆（只開 22/80/443）
- 啟用 fail2ban（擋 SSH 暴力破解）
- 建立 `/opt/t-erp`、`/opt/backups`

### 4. 編輯 .env

```bash
cp .env.production.example .env
nano .env
```

**必填項目：**

```ini
# 沒 domain 就用 IP HTTP 模式
DOMAIN=:80
CORS_ORIGIN=http://<VPS-IP>

# 有 domain：
# DOMAIN=erp.yourcompany.com
# CORS_ORIGIN=https://erp.yourcompany.com

DB_USER=t_erp
DB_PASSWORD=<用 openssl rand -base64 32 生一個>
DB_NAME=t_erp_prod

JWT_SECRET=<用 openssl rand -hex 32 生一個>

FEATURE_WEIGHT=true   # B 客戶（角鋼）= true，A 客戶（無重量）= false
```

**生密碼指令：**
```bash
echo "DB_PASSWORD=$(openssl rand -base64 32)"
echo "JWT_SECRET=$(openssl rand -hex 32)"
```

### 5. 啟動 stack

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

第一次 build 大概 3-5 分鐘。

### 6. 驗證

```bash
# 看狀態
docker compose -f docker-compose.prod.yml ps

# backend healthy 嗎？
curl http://localhost/api/v1/health

# 看 admin
curl -I http://localhost/
```

打開瀏覽器 `http://<VPS-IP>` → 看到登入畫面 → `admin / admin123` 登入。

**第一件事：登入後**改 admin 密碼。

### 7. 設定每日自動備份

```bash
crontab -e
# 加一行（每天 03:00 備份）：
0 3 * * * cd /opt/t-erp && bash scripts/backup.sh daily >> /var/log/t-erp-backup.log 2>&1
```

備份檔放 `/opt/backups/`，會自動保留 14 天。

---

## 加上 domain + HTTPS（可選）

買好 domain 之後：

1. **DNS**：加一筆 A record `erp.yourcompany.com` → `<VPS-IP>`
2. **編輯 `/opt/t-erp/.env`**：
   ```ini
   DOMAIN=erp.yourcompany.com
   CORS_ORIGIN=https://erp.yourcompany.com
   ```
3. **重啟 Caddy**：
   ```bash
   docker compose -f docker-compose.prod.yml restart caddy
   ```

Caddy 會自動跟 Let's Encrypt 申請 SSL（約 30 秒）。打開 `https://erp.yourcompany.com` 應該綠鎖。

---

## 日常維護

### 更新程式（git push 之後）

```bash
ssh root@<VPS-IP>
cd /opt/t-erp
bash scripts/deploy-update.sh             # 預設拉 develop branch
# bash scripts/deploy-update.sh main      # 想拉別的 branch
```

`deploy-update.sh` 會：
1. 自動先備份 DB（`pre-update` tag）
2. `git pull`
3. rebuild backend / admin image
4. 滾動重啟（postgres 不重啟）
5. 等 backend healthy

### 手動備份 / 還原

```bash
# 立刻備份一次
bash scripts/backup.sh "before-test"

# 還原
bash scripts/restore.sh /opt/backups/t-erp-before-test.sql.gz
docker compose -f docker-compose.prod.yml restart backend
```

### 看 log

```bash
# 全部 service
docker compose -f docker-compose.prod.yml logs -f

# 單一 service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f caddy
```

### 重啟單一 service

```bash
docker compose -f docker-compose.prod.yml restart backend
```

### 改 .env 之後

env 變動要重啟才生效：

```bash
docker compose -f docker-compose.prod.yml up -d
```

### 完全重啟 stack

```bash
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

> 注意：`down` 不會刪 postgres 資料（資料在 named volume），但 `down -v` 會。**永遠不要跑 `down -v`**。

---

## 疑難排解

### backend 不 healthy

```bash
docker compose -f docker-compose.prod.yml logs backend | tail -50
```

常見：
- DB 連不上 → 檢查 `.env` 的 `DB_PASSWORD` / `DB_USER` / `DB_NAME` 有沒有跟 postgres service 對齊
- Migration 跑失敗 → 看 log 第幾行炸，可能要手動還原備份再 debug

### 上傳完打開網頁是 502 Bad Gateway

Caddy 找不到 backend：
```bash
docker compose -f docker-compose.prod.yml ps
# 看 backend 狀態，restart 看看
docker compose -f docker-compose.prod.yml restart backend
```

### Build OOM

VPS RAM 不夠（2GB plan 容易中）。解法擇一：
1. 升級到 4GB plan
2. 加 swap：`fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile`
3. 在本機 build → push image → server pull（要設 registry）

### 想看 DB 內容

```bash
docker compose -f docker-compose.prod.yml exec postgres psql -U t_erp -d t_erp_prod
# 進 psql 後：
\dt          # 列所有表
SELECT * FROM users;
\q           # 離開
```

### 完全重來（**會刪掉 DB**）

```bash
docker compose -f docker-compose.prod.yml down -v
rm -rf /opt/backups/*    # 如果連備份也要刪
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 安全提醒

部署上線後檢查：

- [ ] **改 admin 密碼**（不能繼續用 `admin123`）
- [ ] `.env` 的 `JWT_SECRET` / `DB_PASSWORD` **是隨機生成的**（不是 example 預設值）
- [ ] `ufw status` 顯示只開 22 / 80 / 443
- [ ] `fail2ban-client status` 顯示 sshd jail 啟動
- [ ] `crontab -l` 顯示備份排程在跑
- [ ] domain 設好後 SSL 有上（瀏覽器綠鎖）
- [ ] 第一次備份 + 還原**親自演練一次**，確定能還回來

---

## 月費實際估算（4GB plan）

| 項目 | 月費 |
|---|---|
| Vultr / DO 4GB VPS | $24 |
| Domain（可選） | $10/年 = ~$1/月 |
| **總計** | **~$25/月** |

新用戶 promo credit 通常可以撐前 1-3 個月不用錢。
