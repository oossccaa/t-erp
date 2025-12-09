import { request } from './request'
import type { ApiResponse, PaginationResponse, Product } from '@t-erp/shared'

export interface CreateProductDto {
  sku: string
  name: string
  description?: string
  categoryId?: number
  unitPrice: number
  costPrice: number
  stock: number
  minStock: number
  isActive?: boolean
}

export interface UpdateProductDto extends Partial<CreateProductDto> {}

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
    request.put<ApiResponse<Product>>(`/products/${id}`, data),

  // 刪除產品
  deleteProduct: (id: number) => 
    request.delete<ApiResponse<void>>(`/products/${id}`),

  // 批量刪除產品
  deleteProducts: (ids: number[]) => 
    request.delete<ApiResponse<void>>('/products', { data: { ids } }),

  // 更新產品狀態
  updateProductStatus: (id: number, isActive: boolean) => 
    request.patch<ApiResponse<Product>>(`/products/${id}/status`, { isActive }),
}