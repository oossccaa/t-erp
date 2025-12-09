# T-ERP API 文檔

## 🌐 API 概覽

T-ERP 系統提供完整的 RESTful API，支援進銷存管理的所有核心功能。

### 基礎信息

- **Base URL**: `http://localhost:3000/api`
- **認證方式**: JWT Bearer Token
- **內容類型**: `application/json`
- **API 版本**: v1.0

### 快速開始

1. **獲取訪問令牌**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

2. **使用令牌訪問 API**:
```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔐 認證 API

### 用戶登入

**POST** `/auth/login`

```json
{
  "username": "admin",
  "password": "admin123"
}
```

**響應**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

### 刷新令牌

**POST** `/auth/refresh`

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 用戶登出

**POST** `/auth/logout`

**Headers**: `Authorization: Bearer <token>`

## 👥 用戶管理 API

### 獲取用戶列表

**GET** `/users`

**查詢參數**:
- `page`: 頁碼 (默認: 1)
- `limit`: 每頁數量 (默認: 20)
- `search`: 搜尋關鍵字
- `role`: 用戶角色篩選

**響應**:
```json
{
  "data": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### 創建用戶

**POST** `/users`

**請求體**:
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123",
  "role": "user"
}
```

### 獲取用戶詳情

**GET** `/users/:id`

### 更新用戶

**PUT** `/users/:id`

**請求體**:
```json
{
  "email": "updated@example.com",
  "role": "manager"
}
```

### 刪除用戶

**DELETE** `/users/:id`

## 📦 產品管理 API

### 獲取產品列表

**GET** `/products`

**查詢參數**:
- `page`: 頁碼
- `limit`: 每頁數量
- `category`: 分類 ID
- `search`: 搜尋關鍵字
- `status`: 狀態篩選 (active/inactive)

**響應**:
```json
{
  "data": [
    {
      "id": 1,
      "name": "產品名稱",
      "description": "產品描述",
      "sku": "SKU001",
      "price": 100.00,
      "cost": 80.00,
      "category": {
        "id": 1,
        "name": "分類名稱"
      },
      "stock": 50,
      "minStock": 10,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### 創建產品

**POST** `/products`

**請求體**:
```json
{
  "name": "新產品",
  "description": "產品描述",
  "sku": "SKU002",
  "price": 120.00,
  "cost": 90.00,
  "categoryId": 1,
  "minStock": 15,
  "isActive": true
}
```

### 獲取產品詳情

**GET** `/products/:id`

### 更新產品

**PUT** `/products/:id`

### 刪除產品

**DELETE** `/products/:id`

## 📋 訂單管理 API

### 獲取訂單列表

**GET** `/orders`

**查詢參數**:
- `page`: 頁碼
- `limit`: 每頁數量
- `status`: 訂單狀態
- `type`: 訂單類型 (sales/purchase)
- `dateFrom`: 開始日期
- `dateTo`: 結束日期

**響應**:
```json
{
  "data": [
    {
      "id": 1,
      "orderNumber": "SO-2024-001",
      "type": "sales",
      "status": "pending",
      "customer": {
        "id": 1,
        "name": "客戶名稱"
      },
      "totalAmount": 1000.00,
      "items": [
        {
          "id": 1,
          "product": {
            "id": 1,
            "name": "產品名稱"
          },
          "quantity": 10,
          "unitPrice": 100.00,
          "totalPrice": 1000.00
        }
      ],
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### 創建訂單

**POST** `/orders`

**請求體**:
```json
{
  "type": "sales",
  "customerId": 1,
  "items": [
    {
      "productId": 1,
      "quantity": 10,
      "unitPrice": 100.00
    }
  ],
  "notes": "訂單備註"
}
```

### 更新訂單狀態

**PATCH** `/orders/:id/status`

**請求體**:
```json
{
  "status": "confirmed"
}
```

**可用狀態**:
- `pending`: 待處理
- `confirmed`: 已確認
- `processing`: 處理中
- `shipped`: 已發貨
- `delivered`: 已送達
- `cancelled`: 已取消

## 📊 庫存管理 API

### 獲取庫存報表

**GET** `/inventory`

**查詢參數**:
- `productId`: 產品 ID
- `lowStock`: 是否僅顯示低庫存 (true/false)

**響應**:
```json
{
  "data": [
    {
      "productId": 1,
      "product": {
        "id": 1,
        "name": "產品名稱",
        "sku": "SKU001"
      },
      "currentStock": 45,
      "minStock": 10,
      "reservedStock": 5,
      "availableStock": 40,
      "averageCost": 82.50,
      "totalValue": 3712.50,
      "lastMovement": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 庫存調整

**POST** `/inventory/adjust`

**請求體**:
```json
{
  "productId": 1,
  "quantity": 10,
  "type": "in",
  "reason": "盤點調整",
  "notes": "庫存盤點後調整"
}
```

**調整類型**:
- `in`: 入庫
- `out`: 出庫

### 庫存移動記錄

**GET** `/inventory/movements`

**查詢參數**:
- `productId`: 產品 ID
- `type`: 移動類型
- `dateFrom`: 開始日期
- `dateTo`: 結束日期

## 👤 客戶管理 API

### 獲取客戶列表

**GET** `/customers`

**響應**:
```json
{
  "data": [
    {
      "id": 1,
      "name": "客戶名稱",
      "email": "customer@example.com",
      "phone": "0912345678",
      "address": "客戶地址",
      "contactPerson": "聯絡人",
      "creditLimit": 50000.00,
      "paymentTerms": 30,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### 創建客戶

**POST** `/customers`

**請求體**:
```json
{
  "name": "新客戶",
  "email": "newcustomer@example.com",
  "phone": "0987654321",
  "address": "新客戶地址",
  "contactPerson": "新聯絡人",
  "creditLimit": 30000.00,
  "paymentTerms": 15
}
```

## 🏭 供應商管理 API

### 獲取供應商列表

**GET** `/suppliers`

### 創建供應商

**POST** `/suppliers`

**請求體**:
```json
{
  "name": "供應商名稱",
  "email": "supplier@example.com",
  "phone": "0912345678",
  "address": "供應商地址",
  "contactPerson": "聯絡人",
  "paymentTerms": 30,
  "notes": "備註"
}
```

## 📈 報表 API

### 銷售報表

**GET** `/reports/sales`

**查詢參數**:
- `period`: 時間週期 (daily/weekly/monthly/yearly)
- `dateFrom`: 開始日期
- `dateTo`: 結束日期

**響應**:
```json
{
  "summary": {
    "totalSales": 50000.00,
    "totalOrders": 25,
    "averageOrderValue": 2000.00,
    "topProduct": {
      "id": 1,
      "name": "熱銷產品",
      "salesAmount": 10000.00
    }
  },
  "data": [
    {
      "date": "2024-01-01",
      "sales": 2000.00,
      "orders": 2
    }
  ]
}
```

### 庫存報表

**GET** `/reports/inventory`

**響應**:
```json
{
  "summary": {
    "totalProducts": 100,
    "totalValue": 250000.00,
    "lowStockProducts": 5,
    "outOfStockProducts": 2
  },
  "lowStockItems": [
    {
      "productId": 1,
      "productName": "產品名稱",
      "currentStock": 8,
      "minStock": 10
    }
  ]
}
```

## 🔍 搜尋 API

### 全局搜尋

**GET** `/search`

**查詢參數**:
- `q`: 搜尋關鍵字
- `type`: 搜尋類型 (products/customers/orders)

**響應**:
```json
{
  "products": [
    {
      "id": 1,
      "name": "產品名稱",
      "sku": "SKU001"
    }
  ],
  "customers": [
    {
      "id": 1,
      "name": "客戶名稱"
    }
  ],
  "orders": [
    {
      "id": 1,
      "orderNumber": "SO-2024-001"
    }
  ]
}
```

## ⚙️ 系統 API

### 健康檢查

**GET** `/health`

**響應**:
```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    },
    "memory_heap": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up"
    },
    "memory_heap": {
      "status": "up"
    }
  }
}
```

### 系統信息

**GET** `/info`

**響應**:
```json
{
  "app": {
    "name": "T-ERP",
    "version": "1.0.0",
    "environment": "production"
  },
  "uptime": 3600,
  "memory": {
    "used": 150.5,
    "total": 512.0
  }
}
```

## 🚨 錯誤處理

### 錯誤響應格式

```json
{
  "statusCode": 400,
  "message": "驗證失敗",
  "error": "Bad Request",
  "details": [
    {
      "property": "email",
      "constraints": {
        "isEmail": "必須是有效的電子郵件格式"
      }
    }
  ]
}
```

### 常見錯誤碼

| 狀態碼 | 說明 | 解決方案 |
|--------|------|----------|
| 400 | 請求參數錯誤 | 檢查請求格式和參數 |
| 401 | 未授權 | 提供有效的認證令牌 |
| 403 | 權限不足 | 檢查用戶權限 |
| 404 | 資源不存在 | 確認資源 ID 正確 |
| 422 | 數據驗證失敗 | 檢查輸入數據格式 |
| 500 | 服務器內部錯誤 | 聯絡系統管理員 |

## 🔄 API 版本管理

目前 API 版本為 v1.0，所有端點均使用此版本。未來版本更新將向下兼容，或提供版本標識。

## 📊 API 限制

### 請求頻率限制

- **開發環境**: 10,000 請求/小時
- **生產環境**: 1,000 請求/小時

### 響應大小限制

- 最大響應大小: 10MB
- 最大上傳文件大小: 10MB

### 分頁限制

- 默認頁面大小: 20
- 最大頁面大小: 100

## 🛠 SDK 和工具

### JavaScript/TypeScript

```typescript
import { TErpApi } from '@t-erp/sdk'

const api = new TErpApi({
  baseURL: 'http://localhost:3000/api',
  token: 'your-jwt-token'
})

// 獲取產品列表
const products = await api.products.list({ page: 1, limit: 20 })
```

### cURL 範例

```bash
# 設置環境變數
export API_BASE=http://localhost:3000/api
export TOKEN=your-jwt-token

# 獲取產品列表
curl -X GET "$API_BASE/products" \
  -H "Authorization: Bearer $TOKEN"

# 創建產品
curl -X POST "$API_BASE/products" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "新產品",
    "sku": "SKU003",
    "price": 150.00,
    "categoryId": 1
  }'
```

## 📞 技術支援

如需 API 相關技術支援，請：

1. 查閱本文檔和 [FAQ](./FAQ.md)
2. 訪問 Swagger 文檔: `http://localhost:3000/api/docs`
3. 提交 [GitHub Issue](https://github.com/your-org/t-erp/issues)
4. 聯絡技術支援: support@t-erp.com