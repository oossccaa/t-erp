// API 端點配置
export const API_ENDPOINTS = {
  // 認證相關
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    CHANGE_PASSWORD: '/auth/change-password',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  
  // 用戶管理
  USERS: {
    BASE: '/users',
    PROFILE: '/users/profile',
    BY_ID: (id: number) => `/users/${id}`,
    TOGGLE_STATUS: (id: number) => `/users/${id}/toggle-status`,
  },
  
  // 產品管理
  PRODUCTS: {
    BASE: '/products',
    STATS: '/products/stats',
    LOW_STOCK: '/products/low-stock',
    BY_ID: (id: number) => `/products/${id}`,
    BY_SKU: (sku: string) => `/products/sku/${sku}`,
    BY_CATEGORY: (categoryId: number) => `/products/category/${categoryId}`,
    UPDATE_STOCK: (id: number) => `/products/${id}/stock`,
  },
  
  // 產品分類
  CATEGORIES: {
    BASE: '/categories',
    TREE: '/categories/tree',
    ROOT: '/categories/root',
    BY_ID: (id: number) => `/categories/${id}`,
    CHILDREN: (id: number) => `/categories/${id}/children`,
  },
  
  // 供應商管理
  SUPPLIERS: {
    BASE: '/suppliers',
    ACTIVE: '/suppliers/active',
    STATS: '/suppliers/stats',
    BY_ID: (id: number) => `/suppliers/${id}`,
    TOGGLE_STATUS: (id: number) => `/suppliers/${id}/toggle-status`,
  },
  
  // 客戶管理
  CUSTOMERS: {
    BASE: '/customers',
    ACTIVE: '/customers/active',
    STATS: '/customers/stats',
    BY_ID: (id: number) => `/customers/${id}`,
    TOGGLE_STATUS: (id: number) => `/customers/${id}/toggle-status`,
  },
  
  // 訂單管理
  ORDERS: {
    PURCHASE: '/orders/purchase',
    SALE: '/orders/sale',
    BY_ID: (id: number) => `/orders/${id}`,
    ITEMS: (id: number) => `/orders/${id}/items`,
    APPROVE: (id: number) => `/orders/${id}/approve`,
    CANCEL: (id: number) => `/orders/${id}/cancel`,
  },
  
  // 庫存管理
  INVENTORY: {
    BASE: '/inventory',
    TRANSACTIONS: '/inventory/transactions',
    ADJUSTMENTS: '/inventory/adjustments',
    TRANSFERS: '/inventory/transfers',
    ALERTS: '/inventory/alerts',
    REPORTS: '/inventory/reports',
  },
  
  // 報表統計
  REPORTS: {
    DASHBOARD: '/reports/dashboard',
    SALES: '/reports/sales',
    PURCHASES: '/reports/purchases',
    INVENTORY: '/reports/inventory',
    FINANCIAL: '/reports/financial',
    CUSTOM: '/reports/custom',
  },
} as const

// HTTP 狀態碼
export const HTTP_STATUS = {
  // 成功狀態
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  
  // 重定向狀態
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,
  
  // 客戶端錯誤
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  
  // 服務端錯誤
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const

// API 錯誤碼
export const API_ERROR_CODES = {
  // 通用錯誤
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  
  // 認證錯誤
  UNAUTHORIZED: 'UNAUTHORIZED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  FORBIDDEN: 'FORBIDDEN',
  
  // 業務錯誤
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  
  // 數據錯誤
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  FOREIGN_KEY_CONSTRAINT: 'FOREIGN_KEY_CONSTRAINT',
  DATA_INTEGRITY_VIOLATION: 'DATA_INTEGRITY_VIOLATION',
  
  // 庫存錯誤
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  STOCK_LOCKED: 'STOCK_LOCKED',
  INVALID_STOCK_OPERATION: 'INVALID_STOCK_OPERATION',
} as const

// 請求配置
export const REQUEST_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  
  HEADERS: {
    DEFAULT: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    MULTIPART: {
      'Content-Type': 'multipart/form-data',
    },
  },
} as const

// 內容類型
export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
  URL_ENCODED: 'application/x-www-form-urlencoded',
  TEXT: 'text/plain',
  HTML: 'text/html',
  XML: 'application/xml',
  PDF: 'application/pdf',
  CSV: 'text/csv',
  EXCEL: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
} as const