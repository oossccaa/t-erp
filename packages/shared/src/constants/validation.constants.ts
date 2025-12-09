// 驗證規則常量
export const VALIDATION_RULES = {
  // 通用規則
  REQUIRED: '此欄位為必填',
  INVALID_FORMAT: '格式不正確',
  
  // 字串長度規則
  STRING_LENGTH: {
    TOO_SHORT: (min: number) => `至少需要 ${min} 個字符`,
    TOO_LONG: (max: number) => `最多不能超過 ${max} 個字符`,
    BETWEEN: (min: number, max: number) => `長度必須在 ${min} 到 ${max} 個字符之間`,
  },
  
  // 數值規則
  NUMBER: {
    INVALID: '請輸入有效的數字',
    TOO_SMALL: (min: number) => `數值不能小於 ${min}`,
    TOO_LARGE: (max: number) => `數值不能大於 ${max}`,
    BETWEEN: (min: number, max: number) => `數值必須在 ${min} 到 ${max} 之間`,
    POSITIVE: '數值必須為正數',
    NON_NEGATIVE: '數值不能為負數',
    INTEGER: '請輸入整數',
  },
  
  // 電子郵件規則
  EMAIL: {
    INVALID: '請輸入有效的電子郵件地址',
    REQUIRED: '電子郵件為必填項',
    EXISTS: '此電子郵件已被使用',
  },
  
  // 電話號碼規則
  PHONE: {
    INVALID: '請輸入有效的電話號碼',
    FORMAT: '電話號碼格式不正確',
  },
  
  // 密碼規則
  PASSWORD: {
    TOO_SHORT: '密碼至少需要 6 個字符',
    TOO_LONG: '密碼不能超過 50 個字符',
    MISMATCH: '密碼確認不匹配',
    WEAK: '密碼強度太弱',
    REQUIRE_UPPERCASE: '密碼必須包含至少一個大寫字母',
    REQUIRE_LOWERCASE: '密碼必須包含至少一個小寫字母',
    REQUIRE_NUMBER: '密碼必須包含至少一個數字',
    REQUIRE_SYMBOL: '密碼必須包含至少一個特殊字符',
    CURRENT_INCORRECT: '當前密碼不正確',
  },
  
  // 用戶名規則
  USERNAME: {
    INVALID: '用戶名只能包含字母、數字、下劃線和連字符',
    TOO_SHORT: '用戶名至少需要 3 個字符',
    TOO_LONG: '用戶名不能超過 50 個字符',
    EXISTS: '此用戶名已被使用',
    RESERVED: '此用戶名為系統保留字',
  },
  
  // SKU 規則
  SKU: {
    INVALID: '商品編號只能包含大寫字母、數字、下劃線和連字符',
    TOO_SHORT: '商品編號至少需要 3 個字符',
    TOO_LONG: '商品編號不能超過 50 個字符',
    EXISTS: '此商品編號已存在',
    REQUIRED: '商品編號為必填項',
  },
  
  // 價格規則
  PRICE: {
    INVALID: '請輸入有效的價格',
    NEGATIVE: '價格不能為負數',
    TOO_HIGH: '價格超出允許範圍',
    DECIMAL_PLACES: (places: number) => `價格小數位數不能超過 ${places} 位`,
  },
  
  // 數量規則
  QUANTITY: {
    INVALID: '請輸入有效的數量',
    NEGATIVE: '數量不能為負數',
    NOT_INTEGER: '數量必須為整數',
    TOO_LARGE: '數量超出允許範圍',
    INSUFFICIENT: '數量不足',
  },
  
  // 日期規則
  DATE: {
    INVALID: '請輸入有效的日期',
    FUTURE_REQUIRED: '日期必須為未來日期',
    PAST_REQUIRED: '日期必須為過去日期',
    RANGE_INVALID: '結束日期不能早於開始日期',
    FORMAT: '日期格式不正確',
  },
  
  // 文件規則
  FILE: {
    REQUIRED: '請選擇文件',
    TOO_LARGE: (maxSize: string) => `文件大小不能超過 ${maxSize}`,
    INVALID_TYPE: (allowedTypes: string) => `只允許上傳 ${allowedTypes} 類型的文件`,
    UPLOAD_FAILED: '文件上傳失敗',
  },
  
  // 業務規則
  BUSINESS: {
    DUPLICATE_ENTRY: '記錄已存在',
    FOREIGN_KEY_CONSTRAINT: '存在關聯數據，無法刪除',
    STOCK_INSUFFICIENT: '庫存不足',
    ORDER_CANNOT_MODIFY: '訂單狀態不允許修改',
    CATEGORY_HAS_PRODUCTS: '分類下還有產品，無法刪除',
    CATEGORY_HAS_CHILDREN: '分類下還有子分類，無法刪除',
  },
} as const

// 驗證正則表達式
export const VALIDATION_PATTERNS = {
  // 基本模式
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\d-+().\s]+$/,
  USERNAME: /^[a-zA-Z0-9_-]+$/,
  SKU: /^[A-Z0-9_-]+$/,
  
  // 密碼模式
  PASSWORD_UPPERCASE: /[A-Z]/,
  PASSWORD_LOWERCASE: /[a-z]/,
  PASSWORD_NUMBER: /[0-9]/,
  PASSWORD_SYMBOL: /[!@#$%^&*(),.?":{}|<>]/,
  
  // 數字模式
  INTEGER: /^\d+$/,
  DECIMAL: /^\d+(\.\d{1,2})?$/,
  POSITIVE_NUMBER: /^[1-9]\d*$/,
  NON_NEGATIVE_NUMBER: /^(0|[1-9]\d*)$/,
  
  // 日期模式
  DATE_YYYY_MM_DD: /^\d{4}-\d{2}-\d{2}$/,
  DATE_DD_MM_YYYY: /^\d{2}\/\d{2}\/\d{4}$/,
  TIME_HH_MM: /^([01]\d|2[0-3]):([0-5]\d)$/,
  TIME_HH_MM_SS: /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/,
  
  // 特殊格式
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  IP_ADDRESS: /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  MAC_ADDRESS: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
  
  // 中文模式
  CHINESE: /^[\u4e00-\u9fa5]+$/,
  CHINESE_AND_ENGLISH: /^[\u4e00-\u9fa5a-zA-Z\s]+$/,
  CHINESE_ENGLISH_NUMBER: /^[\u4e00-\u9fa5a-zA-Z0-9\s]+$/,
} as const

// 驗證配置
export const VALIDATION_CONFIG = {
  // 長度限制
  LENGTH_LIMITS: {
    USERNAME: { min: 3, max: 50 },
    PASSWORD: { min: 6, max: 50 },
    EMAIL: { min: 5, max: 100 },
    PHONE: { min: 8, max: 20 },
    NAME: { min: 1, max: 100 },
    DESCRIPTION: { min: 0, max: 1000 },
    SKU: { min: 3, max: 50 },
    ADDRESS: { min: 0, max: 500 },
  },
  
  // 數值限制
  NUMBER_LIMITS: {
    PRICE: { min: 0, max: 999999999.99, decimals: 2 },
    QUANTITY: { min: 0, max: 999999999, decimals: 0 },
    PERCENTAGE: { min: 0, max: 100, decimals: 2 },
    DISCOUNT: { min: 0, max: 100, decimals: 2 },
  },
  
  // 文件限制
  FILE_LIMITS: {
    IMAGE: {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    },
    DOCUMENT: {
      maxSize: 20 * 1024 * 1024, // 20MB
      allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    },
    SPREADSHEET: {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'],
    },
  },
  
  // 業務限制
  BUSINESS_LIMITS: {
    ORDER_ITEMS: { max: 100 },
    CATEGORY_DEPTH: { max: 5 },
    SEARCH_RESULTS: { max: 1000 },
    EXPORT_RECORDS: { max: 10000 },
  },
} as const