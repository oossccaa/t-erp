export class ValidationUtil {
  static isEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  static isPhone(phone: string): boolean {
    const phoneRegex = /^[\d-+().\s]+$/
    return phoneRegex.test(phone)
  }

  static isValidPassword(password: string): boolean {
    return password.length >= 6
  }

  static isValidSku(sku: string): boolean {
    const skuRegex = /^[A-Z0-9_-]+$/
    return skuRegex.test(sku)
  }

  static formatPrice(price: number): string {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
    }).format(price)
  }
}