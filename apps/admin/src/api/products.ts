import { request } from './request'
import type { ApiResponse, PaginationResponse, Product } from '@/types'

export interface CreateProductDto {
  sku: string
  name: string
  description?: string
  categoryId?: number
  unitPrice: number
  costPrice: number
  stockQuantity: number
  minStockLevel: number
  // 注意：isActive 不在 CreateProductDto 中，後端會自動設為 true
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  isActive?: boolean
}

export interface ProductQuery {
  page?: number
  limit?: number
  keyword?: string
  categoryId?: number
  isActive?: boolean
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

// 產品 API
export const productsApi = {
  // 獲取產品列表
  getProducts: (query?: ProductQuery) =>
    request.get<PaginationResponse<Product>>('/products', query),

  // 獲取產品詳情
  getProduct: (id: number) => 
    request.get<ApiResponse<Product>>(`/products/${id}`),

  // 創建產品
  createProduct: (data: CreateProductDto) => 
    request.post<ApiResponse<Product>>('/products', data),

  // 更新產品
  updateProduct: (id: number, data: UpdateProductDto) =>
    request.patch<ApiResponse<Product>>(`/products/${id}`, data),

  // 刪除產品
  deleteProduct: (id: number) => 
    request.delete<ApiResponse<void>>(`/products/${id}`),

  // 批量刪除產品
  deleteProducts: (ids: number[]) =>
    request.delete<ApiResponse<void>>('/products/batch', { data: { ids } }),
}