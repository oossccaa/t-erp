import type { BaseEntity, TreeNode } from './api.types'

export interface Product extends BaseEntity {
  sku: string
  name: string
  description?: string
  categoryId?: number
  category?: Category
  unitPrice: number
  costPrice: number
  unit?: string
  weight?: number
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
  taxId?: string
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
  taxId?: string
  isActive: boolean
  customerCode?: string
  creditLimit?: number
  paymentTerms?: string
  notes?: string
}

export interface ProductStats {
  totalProducts: number
  activeProducts: number
  lowStockProducts: number
  totalValue: number
  categoryCount: number
}

export interface CategoryTreeNode extends TreeNode<Category> {
  productCount?: number
}

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

export interface StockAdjustment {
  productId: number
  product?: Product
  quantity: number
  operation: 'add' | 'subtract'
  reason?: string
  userId: number
  createdAt: Date
}
