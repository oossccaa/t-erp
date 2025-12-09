/**
 * 格式化工具函數
 */

// 格式化金額
export const formatCurrency = (amount: number | string, currency = 'TWD'): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '0'
  
  if (currency === 'TWD') {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num)
  }
  
  return new Intl.NumberFormat('zh-TW', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

// formatMoney 別名，用於向後兼容
export const formatMoney = formatCurrency

// 格式化數字
export const formatNumber = (num: number | string, decimals = 0): string => {
  const number = typeof num === 'string' ? parseFloat(num) : num
  if (isNaN(number)) return '0'
  
  return new Intl.NumberFormat('zh-TW', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number)
}

// 格式化百分比
export const formatPercent = (num: number | string, decimals = 1): string => {
  const number = typeof num === 'string' ? parseFloat(num) : num
  if (isNaN(number)) return '0%'
  
  return new Intl.NumberFormat('zh-TW', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number / 100)
}

// 格式化日期
export const formatDate = (date: Date | string | number, format = 'YYYY-MM-DD'): string => {
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  const second = String(d.getSeconds()).padStart(2, '0')
  
  const formatMap: Record<string, string> = {
    'YYYY': year.toString(),
    'MM': month,
    'DD': day,
    'HH': hour,
    'mm': minute,
    'ss': second,
  }
  
  let result = format
  Object.entries(formatMap).forEach(([key, value]) => {
    result = result.replace(key, value)
  })
  
  return result
}

// 格式化時間戳
export const formatDateTime = (date: Date | string | number): string => {
  return formatDate(date, 'YYYY-MM-DD HH:mm:ss')
}

// 格式化相對時間
export const formatRelativeTime = (date: Date | string | number): string => {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)
  const years = Math.floor(months / 12)
  
  if (years > 0) return `${years}年前`
  if (months > 0) return `${months}個月前`
  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小時前`
  if (minutes > 0) return `${minutes}分鐘前`
  return '剛剛'
}

// 格式化檔案大小
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

// 格式化手機號碼
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1-$2-$3')
  }
  return phone
}

// 隱藏敏感資訊
export const maskString = (str: string, start = 2, end = 2, mask = '*'): string => {
  if (str.length <= start + end) {
    return str
  }
  
  const startStr = str.substring(0, start)
  const endStr = str.substring(str.length - end)
  const maskStr = mask.repeat(str.length - start - end)
  
  return startStr + maskStr + endStr
}

// 隱藏電子郵箱
export const maskEmail = (email: string): string => {
  const [username, domain] = email.split('@')
  if (!domain) return email
  
  const maskedUsername = username.length > 2 
    ? username.substring(0, 2) + '*'.repeat(username.length - 2)
    : username
  
  return `${maskedUsername}@${domain}`
}