# @t-erp/shared

T-ERP 系統共享類型定義和工具函數庫。

## 功能特色

- **完整類型定義** - 涵蓋所有業務實體和 API 接口
- **TypeScript 嚴格模式** - 提供完整的類型安全
- **業務常量** - 統一的業務規則和配置常量
- **工具函數** - 常用的驗證和格式化工具
- **樹搖支持** - 支持按需導入，減少打包體積

## 安裝使用

```bash
# 在 monorepo 中使用
pnpm add @t-erp/shared

# 在其他項目中安裝
npm install @t-erp/shared
```

## 使用示例

### 類型定義

```typescript
import { Product, ApiResponse, OrderStatus } from '@t-erp/shared'

// 使用產品類型
const product: Product = {
  id: 1,
  sku: 'PROD001',
  name: 'iPhone 15',
  unitPrice: 30000,
  stockQuantity: 50,
  // ...其他屬性
}

// 使用 API 響應類型
const response: ApiResponse<Product[]> = {
  success: true,
  data: [product],
  message: '獲取產品列表成功'
}
```

### 業務常量

```typescript
import { ORDER_STATUSES, VALIDATION_RULES, API_ENDPOINTS } from '@t-erp/shared'

// 使用訂單狀態常量
const status = ORDER_STATUSES.PENDING

// 使用驗證規則
const emailError = VALIDATION_RULES.EMAIL.INVALID

// 使用 API 端點
const url = API_ENDPOINTS.PRODUCTS.BASE
```

### 工具函數

```typescript
import { ValidationUtil, ResponseUtil } from '@t-erp/shared'

// 驗證電子郵件
const isValid = ValidationUtil.isEmail('user@example.com')

// 格式化價格
const formattedPrice = ValidationUtil.formatPrice(30000)

// 創建成功響應
const response = ResponseUtil.success(data, '操作成功')
```

## 目錄結構

```
src/
├── types/              # 類型定義
│   ├── api.types.ts           # API 相關類型
│   ├── user.types.ts          # 用戶相關類型
│   ├── product.types.ts       # 產品相關類型
│   ├── order.types.ts         # 訂單相關類型
│   ├── inventory.types.ts     # 庫存相關類型
│   ├── query.types.ts         # 查詢相關類型
│   └── analytics.types.ts     # 分析報表類型
├── enums/              # 枚舉定義
├── constants/          # 常量定義
│   ├── app.constants.ts       # 應用常量
│   ├── api.constants.ts       # API 常量
│   ├── business.constants.ts  # 業務常量
│   └── validation.constants.ts # 驗證常量
├── dtos/               # 數據傳輸對象
├── interfaces/         # 接口定義
├── utils/              # 工具函數
└── index.ts            # 統一導出
```

## 主要類型

### 基礎類型
- `BaseEntity` - 基礎實體類型
- `ApiResponse<T>` - 統一 API 響應類型
- `PaginationQuery` - 分頁查詢參數
- `PaginationResponse<T>` - 分頁響應類型

### 業務類型
- `Product` - 產品類型
- `Category` - 分類類型
- `Customer` - 客戶類型
- `Supplier` - 供應商類型
- `PurchaseOrder` - 進貨單類型
- `SaleOrder` - 銷貨單類型

### 庫存類型
- `InventoryTransaction` - 庫存異動記錄
- `InventoryAdjustment` - 庫存調整單
- `InventoryStats` - 庫存統計

### 分析類型
- `DashboardStats` - 儀表板統計
- `SalesAnalytics` - 銷售分析
- `InventoryAnalytics` - 庫存分析

## 開發指南

### 添加新類型

1. 在對應的類型文件中定義接口
2. 添加相關的 DTO 和枚舉
3. 更新 `index.ts` 導出
4. 添加相關常量和驗證規則

### 版本控制

- 遵循 [Semantic Versioning](https://semver.org/)
- 破壞性變更需要主版本號更新
- 新增功能使用次版本號更新
- Bug 修復使用補丁版本號更新

## 許可證

MIT License