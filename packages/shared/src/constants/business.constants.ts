// 訂單狀態常量
export const ORDER_STATUSES = {
  DRAFT: 'draft',
  PENDING: 'pending',
  APPROVED: 'approved',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
} as const

// 訂單狀態顯示名稱
export const ORDER_STATUS_LABELS = {
  [ORDER_STATUSES.DRAFT]: '草稿',
  [ORDER_STATUSES.PENDING]: '待審核',
  [ORDER_STATUSES.APPROVED]: '已審核',
  [ORDER_STATUSES.PROCESSING]: '處理中',
  [ORDER_STATUSES.SHIPPED]: '已出貨',
  [ORDER_STATUSES.DELIVERED]: '已交付',
  [ORDER_STATUSES.COMPLETED]: '已完成',
  [ORDER_STATUSES.CANCELLED]: '已取消',
  [ORDER_STATUSES.RETURNED]: '已退貨',
} as const

// 付款狀態常量
export const PAYMENT_STATUSES = {
  UNPAID: 'unpaid',
  PARTIAL: 'partial',
  PAID: 'paid',
  OVERDUE: 'overdue',
  REFUNDED: 'refunded',
} as const

// 付款狀態顯示名稱
export const PAYMENT_STATUS_LABELS = {
  [PAYMENT_STATUSES.UNPAID]: '未付款',
  [PAYMENT_STATUSES.PARTIAL]: '部分付款',
  [PAYMENT_STATUSES.PAID]: '已付款',
  [PAYMENT_STATUSES.OVERDUE]: '逾期',
  [PAYMENT_STATUSES.REFUNDED]: '已退款',
} as const

// 庫存異動類型常量
export const INVENTORY_TRANSACTION_TYPES = {
  // 入庫類型
  PURCHASE_IN: 'purchase_in',
  RETURN_IN: 'return_in',
  ADJUSTMENT_IN: 'adjustment_in',
  TRANSFER_IN: 'transfer_in',
  PRODUCTION_IN: 'production_in',
  
  // 出庫類型
  SALE_OUT: 'sale_out',
  RETURN_OUT: 'return_out',
  ADJUSTMENT_OUT: 'adjustment_out',
  TRANSFER_OUT: 'transfer_out',
  DAMAGE_OUT: 'damage_out',
  CONSUMPTION_OUT: 'consumption_out',
} as const

// 庫存異動類型顯示名稱
export const INVENTORY_TRANSACTION_TYPE_LABELS = {
  [INVENTORY_TRANSACTION_TYPES.PURCHASE_IN]: '進貨入庫',
  [INVENTORY_TRANSACTION_TYPES.RETURN_IN]: '退貨入庫',
  [INVENTORY_TRANSACTION_TYPES.ADJUSTMENT_IN]: '調整入庫',
  [INVENTORY_TRANSACTION_TYPES.TRANSFER_IN]: '調撥入庫',
  [INVENTORY_TRANSACTION_TYPES.PRODUCTION_IN]: '生產入庫',
  [INVENTORY_TRANSACTION_TYPES.SALE_OUT]: '銷貨出庫',
  [INVENTORY_TRANSACTION_TYPES.RETURN_OUT]: '退貨出庫',
  [INVENTORY_TRANSACTION_TYPES.ADJUSTMENT_OUT]: '調整出庫',
  [INVENTORY_TRANSACTION_TYPES.TRANSFER_OUT]: '調撥出庫',
  [INVENTORY_TRANSACTION_TYPES.DAMAGE_OUT]: '損耗出庫',
  [INVENTORY_TRANSACTION_TYPES.CONSUMPTION_OUT]: '消耗出庫',
} as const

// 用戶角色常量
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
} as const

// 用戶角色顯示名稱
export const USER_ROLE_LABELS = {
  [USER_ROLES.ADMIN]: '系統管理員',
  [USER_ROLES.MANAGER]: '經理',
  [USER_ROLES.USER]: '一般用戶',
} as const

// 權限常量
export const PERMISSIONS = {
  // 用戶管理權限
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  
  // 產品管理權限
  PRODUCT_CREATE: 'product:create',
  PRODUCT_READ: 'product:read',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',
  
  // 訂單管理權限
  ORDER_CREATE: 'order:create',
  ORDER_READ: 'order:read',
  ORDER_UPDATE: 'order:update',
  ORDER_DELETE: 'order:delete',
  ORDER_APPROVE: 'order:approve',
  
  // 庫存管理權限
  INVENTORY_READ: 'inventory:read',
  INVENTORY_ADJUST: 'inventory:adjust',
  INVENTORY_TRANSFER: 'inventory:transfer',
  
  // 報表權限
  REPORT_VIEW: 'report:view',
  REPORT_EXPORT: 'report:export',
  
  // 系統設定權限
  SYSTEM_CONFIG: 'system:config',
} as const

// 業務規則常量
export const BUSINESS_RULES = {
  // 密碼規則
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 50,
    REQUIRE_UPPERCASE: false,
    REQUIRE_LOWERCASE: false,
    REQUIRE_NUMBERS: true,
    REQUIRE_SYMBOLS: false,
  },
  
  // SKU 規則
  SKU: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50,
    PATTERN: /^[A-Z0-9_-]+$/,
    AUTO_GENERATE: false,
  },
  
  // 訂單編號規則
  ORDER_NUMBER: {
    PREFIX: {
      PURCHASE: 'PO',
      SALE: 'SO',
    },
    LENGTH: 12,
    AUTO_GENERATE: true,
  },
  
  // 價格規則
  PRICE: {
    MIN_VALUE: 0,
    MAX_VALUE: 999999999.99,
    DECIMAL_PLACES: 2,
  },
  
  // 數量規則
  QUANTITY: {
    MIN_VALUE: 0,
    MAX_VALUE: 999999999,
    DECIMAL_PLACES: 0,
  },
  
  // 庫存規則
  INVENTORY: {
    ALLOW_NEGATIVE: false,
    LOW_STOCK_THRESHOLD: 10,
    AUTO_REORDER: false,
  },
} as const

// 預設值常量
export const DEFAULT_VALUES = {
  // 分頁預設值
  PAGE_SIZE: 10,
  PAGE_SIZES: [10, 20, 50, 100],
  
  // 稅率預設值
  TAX_RATE: 0.05, // 5%
  
  // 貨幣預設值
  CURRENCY: 'TWD',
  CURRENCY_SYMBOL: 'NT$',
  
  // 日期格式
  DATE_FORMAT: 'YYYY-MM-DD',
  DATETIME_FORMAT: 'YYYY-MM-DD HH:mm:ss',
  
  // 產品預設值
  PRODUCT: {
    MIN_STOCK_LEVEL: 10,
    IS_ACTIVE: true,
  },
  
  // 供應商/客戶預設值
  PARTNER: {
    IS_ACTIVE: true,
  },
} as const

// 狀態顏色配置
export const STATUS_COLORS = {
  SUCCESS: '#52c41a',
  WARNING: '#faad14',
  ERROR: '#f5222d',
  INFO: '#1890ff',
  DEFAULT: '#d9d9d9',
  
  // 訂單狀態顏色
  ORDER_STATUS: {
    [ORDER_STATUSES.DRAFT]: '#d9d9d9',
    [ORDER_STATUSES.PENDING]: '#faad14',
    [ORDER_STATUSES.APPROVED]: '#1890ff',
    [ORDER_STATUSES.PROCESSING]: '#722ed1',
    [ORDER_STATUSES.SHIPPED]: '#13c2c2',
    [ORDER_STATUSES.DELIVERED]: '#52c41a',
    [ORDER_STATUSES.COMPLETED]: '#52c41a',
    [ORDER_STATUSES.CANCELLED]: '#f5222d',
    [ORDER_STATUSES.RETURNED]: '#fa8c16',
  },
  
  // 付款狀態顏色
  PAYMENT_STATUS: {
    [PAYMENT_STATUSES.UNPAID]: '#f5222d',
    [PAYMENT_STATUSES.PARTIAL]: '#faad14',
    [PAYMENT_STATUSES.PAID]: '#52c41a',
    [PAYMENT_STATUSES.OVERDUE]: '#f5222d',
    [PAYMENT_STATUSES.REFUNDED]: '#722ed1',
  },
} as const