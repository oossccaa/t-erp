export interface CreateProductDto {
  sku: string
  name: string
  description?: string
  categoryId?: number
  unitPrice: number
  costPrice: number
  stockQuantity: number
  minStockLevel: number
}

export interface UpdateProductDto {
  name?: string
  description?: string
  categoryId?: number
  unitPrice?: number
  costPrice?: number
  stockQuantity?: number
  minStockLevel?: number
  isActive?: boolean
}

export interface CreateCategoryDto {
  name: string
  description?: string
  parentId?: number
}

export interface UpdateCategoryDto {
  name?: string
  description?: string
  parentId?: number
}