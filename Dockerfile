# 多階段構建 Dockerfile
FROM node:18-alpine AS base

# 安裝 pnpm 和必要的工具
RUN npm install -g pnpm@8 && \
    apk add --no-cache libc6-compat

# 設置工作目錄
WORKDIR /app

# 複製 package 配置文件
COPY package.json pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/admin/package.json ./apps/admin/
COPY apps/client/package.json ./apps/client/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/

# 安裝依賴
RUN pnpm install --frozen-lockfile

# 複製共享包源碼
COPY packages/ ./packages/

# Backend 構建階段
FROM base AS backend-build
COPY apps/backend/ ./apps/backend/
RUN pnpm --filter @t-erp/shared build && \
    pnpm --filter @t-erp/backend build

# Frontend Admin 構建階段  
FROM base AS admin-build
COPY apps/admin/ ./apps/admin/
RUN pnpm --filter @t-erp/ui build && \
    pnpm --filter @t-erp/admin build

# Frontend Client 構建階段
FROM base AS client-build
COPY apps/client/ ./apps/client/
RUN pnpm --filter @t-erp/ui build && \
    pnpm --filter @t-erp/client build

# Backend 運行時鏡像
FROM node:18-alpine AS backend-runtime

# 安裝運行時依賴
RUN apk add --no-cache curl && \
    npm install -g pnpm@8

WORKDIR /app

# 創建非 root 用戶
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# 複製 backend 構建產物和依賴
COPY --from=backend-build --chown=nestjs:nodejs /app/apps/backend/dist ./
COPY --from=backend-build --chown=nestjs:nodejs /app/apps/backend/package.json ./package.json
COPY --from=backend-build --chown=nestjs:nodejs /app/node_modules ./node_modules

# 切換到非 root 用戶
USER nestjs

EXPOSE 3000

# 健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "main.js"]

# Admin 運行時鏡像 (Nginx)
FROM nginx:alpine AS admin-runtime

# 創建非 root 用戶
RUN addgroup -g 101 -S nginx && \
    adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx

# 複製構建產物
COPY --from=admin-build /app/apps/admin/dist /usr/share/nginx/html

# 複製 nginx 配置
COPY docker/nginx/admin.conf /etc/nginx/conf.d/default.conf

# 設置權限
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

# Client 運行時鏡像 (Nginx)  
FROM nginx:alpine AS client-runtime

# 創建非 root 用戶
RUN addgroup -g 101 -S nginx && \
    adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx

# 複製構建產物
COPY --from=client-build /app/apps/client/dist /usr/share/nginx/html

# 複製 nginx 配置
COPY docker/nginx/client.conf /etc/nginx/conf.d/default.conf

# 設置權限
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]