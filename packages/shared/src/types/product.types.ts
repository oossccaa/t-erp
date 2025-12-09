import type { BaseEntity, TreeNode } from './api.types'

export interface Product extends BaseEntity {
  sku: string
  name: string
  description?: string
  categoryId?: number
  category?: Category
  unitPrice: number
  costPrice: number
  stockQuantity: number
  minStockLevel: number
  isActive: boolean
  profitMargin?: number
  averageCost?: number
}

export interface Category extends BaseEntity {
  name: string
  description?: string
  parentId?: number
  parent?: Category
  children?: Category[]
  productCount?: number
}

export interface Supplier extends BaseEntity {
  name: string
  contactPerson?: string
  phone?: string
  email?: string
  address?: string
  isActive: boolean
  supplierCode?: string
  paymentTerms?: string
  notes?: string
}

export interface Customer extends BaseEntity {
  name: string
  contactPerson?: string
  phone?: string
  email?: string
  address?: string
  isActive: boolean
  customerCode?: string
  creditLimit?: number
  paymentTerms?: string
  notes?: string
}

// 產品相關統計
export interface ProductStats {
  totalProducts: number
  activeProducts: number
  lowStockProducts: number
  totalValue: number
  categoryCount: number
}

// 分類樹節點
export interface CategoryTreeNode extends TreeNode<Category> {
  productCount?: number
}

// 產品查詢參數
export interface ProductQuery {
  page?: number
  limit?: number
  search?: string
  categoryId?: number
  isActive?: boolean
  lowStock?: boolean
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  minPrice?: number
  maxPrice?: number
}

// 庫存調整記錄
export interface StockAdjustment {
  productId: number
  product?: Product
  quantity: number
  operation: 'add' | 'subtract'
  reason?: string
  userId: number
  createdAt: Date
}