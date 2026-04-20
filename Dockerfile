# ===== Base: workspace + deps =====
FROM node:20-alpine AS base
RUN npm install -g pnpm@10.33.0 && apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/admin/package.json ./apps/admin/

RUN pnpm install --frozen-lockfile

# ===== Backend build =====
FROM base AS backend-build
COPY apps/backend/ ./apps/backend/
RUN pnpm --filter @t-erp/backend build

# ===== Admin build =====
FROM base AS admin-build
COPY apps/admin/ ./apps/admin/
RUN pnpm --filter @t-erp/admin build

# ===== Backend runtime =====
FROM node:20-alpine AS backend-runtime
RUN apk add --no-cache curl && npm install -g pnpm@10.33.0
WORKDIR /app

RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

COPY --chown=nestjs:nodejs package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY --chown=nestjs:nodejs apps/backend/package.json ./apps/backend/
RUN pnpm install --frozen-lockfile --prod --filter @t-erp/backend

COPY --from=backend-build --chown=nestjs:nodejs /app/apps/backend/dist ./apps/backend/dist

USER nestjs
WORKDIR /app/apps/backend

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "dist/main.js"]

# ===== Admin runtime (Nginx serving static files) =====
FROM nginx:alpine AS admin-runtime

COPY --from=admin-build /app/apps/admin/dist /usr/share/nginx/html
COPY docker/nginx/admin.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
