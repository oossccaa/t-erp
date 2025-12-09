# T-ERP 開發指南

## 🛠 開發環境設置

### 系統要求

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0
- **PostgreSQL**: >= 15
- **Redis**: >= 7
- **Docker**: >= 20.0 (可選)

### 環境安裝

#### 1. 安裝 Node.js 和 pnpm

```bash
# 使用 nvm 安裝 Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# 安裝 pnpm
npm install -g pnpm
```

#### 2. 安裝資料庫

**PostgreSQL 安裝 (macOS)**:
```bash
brew install postgresql@15
brew services start postgresql@15
```

**PostgreSQL 安裝 (Ubuntu)**:
```bash
sudo apt update
sudo apt install postgresql-15 postgresql-client-15
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Redis 安裝**:
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

### 專案設置

#### 1. 克隆專案

```bash
git clone <repository-url>
cd t-erp
```

#### 2. 安裝依賴

```bash
pnpm install
```

#### 3. 設置環境變數

```bash
# 複製開發環境配置
cp .env.development .env

# 編輯配置（根據需要修改資料庫密碼等）
vim .env
```

#### 4. 設置資料庫

```bash
# 連接到 PostgreSQL
psql -U postgres

# 創建資料庫
CREATE DATABASE t_erp_dev;
CREATE USER t_erp_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE t_erp_dev TO t_erp_user;
\q
```

#### 5. 啟動開發服務

```bash
# 啟動所有服務
pnpm dev

# 或分別啟動各個服務
pnpm --filter @t-erp/backend dev    # 後端 API (http://localhost:3000)
pnpm --filter @t-erp/admin dev      # 管理後台 (http://localhost:3001)
pnpm --filter @t-erp/client dev     # 客戶端 (http://localhost:3002)
```

## 📁 專案結構

```
t-erp/
├── apps/                    # 應用程式
│   ├── backend/            # NestJS 後端 API
│   ├── admin/              # Vue3 管理後台
│   └── client/             # Vue3 客戶端
├── packages/               # 共享套件
│   ├── types/              # TypeScript 類型定義
│   └── ui/                 # 共享 UI 組件
├── docs/                   # 文檔
├── scripts/                # 部署腳本
└── docker/                 # Docker 配置
```

### 後端架構 (apps/backend)

```
src/
├── modules/                # 功能模組
│   ├── auth/              # 認證模組
│   ├── users/             # 用戶管理
│   ├── products/          # 產品管理
│   ├── orders/            # 訂單管理
│   ├── inventory/         # 庫存管理
│   ├── customers/         # 客戶管理
│   └── suppliers/         # 供應商管理
├── common/                # 共用模組
│   ├── decorators/        # 裝飾器
│   ├── filters/           # 異常過濾器
│   ├── guards/            # 守衛
│   ├── interceptors/      # 攔截器
│   └── pipes/             # 管道
├── config/                # 配置文件
├── database/              # 資料庫相關
│   ├── entities/          # 實體定義
│   ├── migrations/        # 資料庫遷移
│   └── seeds/             # 初始數據
└── main.ts                # 應用入口
```

### 前端架構 (apps/admin, apps/client)

```
src/
├── components/            # Vue 組件
├── views/                 # 頁面組件
├── router/                # 路由配置
├── stores/                # Pinia 狀態管理
├── composables/           # 組合式函數
├── utils/                 # 工具函數
├── api/                   # API 接口
├── types/                 # TypeScript 類型
└── main.ts                # 應用入口
```

## 🔧 開發工具

### IDE 推薦配置

**VS Code 擴展**:
- Vue Language Features (Volar)
- TypeScript Vue Plugin (Volar)
- ESLint
- Prettier
- Auto Rename Tag
- GitLens

**設置文件** (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative",
  "vue.server.hybridMode": true
}
```

### 代碼風格

專案使用統一的代碼風格配置：

- **ESLint**: 代碼檢查
- **Prettier**: 代碼格式化
- **Husky**: Git hooks
- **lint-staged**: 暫存區代碼檢查

### Git 工作流

1. **分支命名規範**:
   - `feature/功能名稱`: 新功能開發
   - `bugfix/問題描述`: Bug 修復
   - `hotfix/緊急修復`: 緊急修復
   - `refactor/重構描述`: 代碼重構

2. **提交信息規範**:
   ```
   type(scope): description
   
   feat(auth): 添加 JWT 認證功能
   fix(orders): 修復訂單狀態更新問題
   docs(readme): 更新安裝說明
   style(admin): 調整登入頁面樣式
   refactor(api): 重構用戶管理 API
   test(units): 添加產品管理單元測試
   ```

## 🧪 測試

### 運行測試

```bash
# 後端測試
pnpm --filter @t-erp/backend test        # 單元測試
pnpm --filter @t-erp/backend test:e2e    # 端到端測試
pnpm --filter @t-erp/backend test:cov    # 覆蓋率測試

# 前端測試
pnpm --filter @t-erp/admin test          # 管理後台測試
pnpm --filter @t-erp/client test         # 客戶端測試
```

### 測試結構

**後端測試**:
```
test/
├── unit/                  # 單元測試
├── integration/           # 整合測試
└── e2e/                   # 端到端測試
```

**前端測試**:
```
tests/
├── unit/                  # 組件單元測試
└── e2e/                   # 頁面端到端測試
```

## 🔄 API 開發

### 創建新的 API 端點

1. **創建實體** (Entity):
```typescript
// src/database/entities/example.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('examples')
export class Example {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string
}
```

2. **創建 DTO**:
```typescript
// src/modules/examples/dto/create-example.dto.ts
import { IsString, IsNotEmpty } from 'class-validator'

export class CreateExampleDto {
  @IsString()
  @IsNotEmpty()
  name: string
}
```

3. **創建服務**:
```typescript
// src/modules/examples/examples.service.ts
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Example } from './entities/example.entity'

@Injectable()
export class ExamplesService {
  constructor(
    @InjectRepository(Example)
    private exampleRepository: Repository<Example>
  ) {}

  create(createExampleDto: CreateExampleDto) {
    return this.exampleRepository.save(createExampleDto)
  }
}
```

4. **創建控制器**:
```typescript
// src/modules/examples/examples.controller.ts
import { Controller, Post, Body } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { ExamplesService } from './examples.service'

@ApiTags('範例管理')
@Controller('examples')
export class ExamplesController {
  constructor(private readonly examplesService: ExamplesService) {}

  @Post()
  @ApiOperation({ summary: '創建範例' })
  create(@Body() createExampleDto: CreateExampleDto) {
    return this.examplesService.create(createExampleDto)
  }
}
```

### 資料庫遷移

```bash
# 生成遷移文件
pnpm --filter @t-erp/backend migration:generate src/database/migrations/AddExampleTable

# 運行遷移
pnpm --filter @t-erp/backend migration:run

# 回滾遷移
pnpm --filter @t-erp/backend migration:revert
```

## 🎨 前端開發

### 創建新頁面

1. **創建 Vue 組件**:
```vue
<!-- src/views/ExampleView.vue -->
<template>
  <div class="example-view">
    <h1>範例頁面</h1>
  </div>
</template>

<script setup lang="ts">
// 組件邏輯
</script>

<style scoped>
.example-view {
  padding: 20px;
}
</style>
```

2. **添加路由**:
```typescript
// src/router/index.ts
{
  path: '/examples',
  name: 'Examples',
  component: () => import('@/views/ExampleView.vue')
}
```

3. **創建 API 接口**:
```typescript
// src/api/examples.ts
import { api } from './base'

export interface Example {
  id: number
  name: string
}

export const examplesApi = {
  getList: () => api.get<Example[]>('/examples'),
  create: (data: Omit<Example, 'id'>) => api.post<Example>('/examples', data)
}
```

### 狀態管理

```typescript
// src/stores/examples.ts
import { defineStore } from 'pinia'
import { examplesApi, type Example } from '@/api/examples'

export const useExamplesStore = defineStore('examples', () => {
  const examples = ref<Example[]>([])
  const loading = ref(false)

  const fetchExamples = async () => {
    loading.value = true
    try {
      const { data } = await examplesApi.getList()
      examples.value = data
    } finally {
      loading.value = false
    }
  }

  return {
    examples,
    loading,
    fetchExamples
  }
})
```

## 🚀 部署

### 開發環境部署

```bash
# 使用 Docker 開發環境
./scripts/docker-dev.sh start

# 停止開發環境
./scripts/docker-dev.sh stop
```

### 生產環境部署

```bash
# 構建和部署
./scripts/deploy.sh deploy

# 查看服務狀態
./scripts/deploy.sh status

# 查看日誌
./scripts/deploy.sh logs

# 重啟服務
./scripts/deploy.sh restart
```

## 🐛 調試技巧

### 後端調試

1. **啟用 SQL 日誌**:
```bash
export ENABLE_SQL_LOGGING=true
pnpm --filter @t-erp/backend dev
```

2. **使用調試模式**:
```bash
export ENABLE_DEBUG=true
pnpm --filter @t-erp/backend dev
```

### 前端調試

1. **Vue DevTools**: 安裝瀏覽器擴展
2. **Network 面板**: 查看 API 請求
3. **Console 日誌**: 查看運行時錯誤

## 📝 文檔維護

### API 文檔

API 文檔使用 Swagger 自動生成，訪問 `http://localhost:3000/api/docs`

### 代碼文檔

使用 JSDoc 格式編寫代碼註釋：

```typescript
/**
 * 創建新用戶
 * @param userData 用戶數據
 * @returns 創建的用戶信息
 */
async createUser(userData: CreateUserDto): Promise<User> {
  // 實現邏輯
}
```

## 🔍 性能優化

### 後端優化

1. **資料庫查詢優化**:
   - 使用索引
   - 避免 N+1 查詢
   - 使用查詢緩存

2. **API 響應優化**:
   - 實現分頁
   - 使用壓縮中間件
   - 添加緩存標頭

### 前端優化

1. **打包優化**:
   - 代碼分割
   - Tree shaking
   - 資源壓縮

2. **運行時優化**:
   - 虛擬滾動
   - 組件懶加載
   - 圖片優化

## 📞 獲取幫助

- **文檔**: [查看完整文檔](../README.md)
- **API 參考**: [API 文檔](./API.md)
- **常見問題**: [FAQ](./FAQ.md)
- **問題報告**: [GitHub Issues](https://github.com/your-org/t-erp/issues)