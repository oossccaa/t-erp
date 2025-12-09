import { request } from './request'
import type { ApiResponse, Category } from '@t-erp/shared'

export interface CreateCategoryDto {
  name: string
  description?: string
  parentId?: number
  isActive?: boolean
  sort?: number
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {}

export interface CategoryQuery {
  search?: string
  parentId?: number | null
  isActive?: boolean
  level?: number
}

// 分類 API
export const categoriesApi = {
  // 獲取分類列表
  getCategories: (query?: CategoryQuery) => 
    request.get<ApiResponse<Category[]>>('/categories', { params: query }),

  // 獲取分類樹
  getCategoryTree: () => 
    request.get<ApiResponse<Category[]>>('/categories/tree'),

  // 獲取分類詳情
  getCategory: (id: number) => 
    request.get<ApiResponse<Category>>(`/categories/${id}`),

  // 創建分類
  createCategory: (data: CreateCategoryDto) => 
    request.post<ApiResponse<Category>>('/categories', data),

  // 更新分類
  updateCategory: (id: number, data: UpdateCategoryDto) => 
    request.put<ApiResponse<Category>>(`/categories/${id}`, data),

  // 刪除分類
  deleteCategory: (id: number) => 
    request.delete<ApiResponse<void>>(`/categories/${id}`),

  // 更新分類排序
  updateCategorySort: (items: Array<{ id: number; sort: number; parentId?: number }>) => 
    request.patch<ApiResponse<void>>('/categories/sort', { items }),

  // 更新分類狀態
  updateCategoryStatus: (id: number, isActive: boolean) => 
    request.patch<ApiResponse<Category>>(`/categories/${id}/status`, { isActive }),
}