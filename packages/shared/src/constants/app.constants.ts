// 應用基本配置
export const APP_CONFIG = {
  NAME: 'T-ERP',
  VERSION: '1.0.0',
  DESCRIPTION: '小工廠進銷存管理系統',
  AUTHOR: 'T-ERP Team',
  WEBSITE: 'https://t-erp.com',
  SUPPORT_EMAIL: 'support@t-erp.com',
} as const

// 默認配置
export const DEFAULT_CONFIG = {
  PAGINATION: {
    PAGE: 1,
    LIMIT: 10,
    MAX_LIMIT: 100,
  },
  SORT: {
    ORDER: 'DESC' as const,
    FIELD: 'createdAt',
  },
  DATE: {
    FORMAT: 'YYYY-MM-DD',
    DATETIME_FORMAT: 'YYYY-MM-DD HH:mm:ss',
    TIME_FORMAT: 'HH:mm:ss',
    TIMEZONE: 'Asia/Taipei',
  },
  CURRENCY: {
    CODE: 'TWD',
    SYMBOL: 'NT$',
    DECIMAL_PLACES: 0,
  },
  LANGUAGE: {
    DEFAULT: 'zh-TW',
    SUPPORTED: ['zh-TW', 'zh-CN', 'en-US'],
  },
} as const

// 系統限制
export const SYSTEM_LIMITS = {
  // 文件上傳限制
  FILE_UPLOAD: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
  },
  
  // 字串長度限制
  STRING_LENGTHS: {
    SHORT: 50,
    MEDIUM: 100,
    LONG: 200,
    TEXT: 500,
    DESCRIPTION: 1000,
  },
  
  // 數值限制
  NUMBER_LIMITS: {
    MIN_PRICE: 0,
    MAX_PRICE: 999999999.99,
    MIN_QUANTITY: 0,
    MAX_QUANTITY: 999999999,
    DECIMAL_PLACES: {
      PRICE: 2,
      QUANTITY: 0,
      PERCENTAGE: 2,
    },
  },
  
  // 業務限制
  BUSINESS_LIMITS: {
    MAX_ORDER_ITEMS: 100,
    MAX_CATEGORY_DEPTH: 5,
    MAX_SKU_LENGTH: 50,
    ORDER_NUMBER_LENGTH: 20,
  },
} as const

// 系統狀態
export const SYSTEM_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DELETED: 'deleted',
} as const

// 快取配置
export const CACHE_CONFIG = {
  TTL: {
    SHORT: 5 * 60, // 5 minutes
    MEDIUM: 30 * 60, // 30 minutes
    LONG: 60 * 60, // 1 hour
    DAILY: 24 * 60 * 60, // 24 hours
  },
  KEYS: {
    USER_SESSION: 'user_session',
    PRODUCT_LIST: 'product_list',
    CATEGORY_TREE: 'category_tree',
    DASHBOARD_STATS: 'dashboard_stats',
  },
} as const

// 通知配置
export const NOTIFICATION_CONFIG = {
  TYPES: {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
  },
  DURATION: {
    SHORT: 3000,
    MEDIUM: 5000,
    LONG: 10000,
  },
} as const