import { request } from './request'
import type { ApiResponse, Supplier } from '@t-erp/shared'

export interface CreateSupplierDto {
  name: string
  contactPerson?: string
  phone?: string
  email?: string
  address?: string
}

export interface UpdateSupplierDto extends Partial<CreateSupplierDto> {}

// 供應商 API
export const suppliersApi = {
  // 獲取供應商列表
  getSuppliers: (search?: string) =>
    request.get<ApiResponse<Supplier[]>>('/suppliers', { search }),

  // 獲取啟用的供應商列表
  getActiveSuppliers: () =>
    request.get<ApiResponse<Supplier[]>>('/suppliers/active'),

  // 獲取供應商統計信息
  getSupplierStats: () =>
    request.get<ApiResponse<any>>('/suppliers/stats'),

  // 獲取供應商詳情
  getSupplier: (id: number) =>
    request.get<ApiResponse<Supplier>>(`/suppliers/${id}`),

  // 創建供應商
  createSupplier: (data: CreateSupplierDto) =>
    request.post<ApiResponse<Supplier>>('/suppliers', data),

  // 更新供應商
  updateSupplier: (id: number, data: UpdateSupplierDto) =>
    request.patch<ApiResponse<Supplier>>(`/suppliers/${id}`, data),

  // 切換供應商狀態
  toggleSupplierStatus: (id: number) =>
    request.patch<ApiResponse<Supplier>>(`/suppliers/${id}/toggle-status`),

  // 刪除供應商
  deleteSupplier: (id: number) =>
    request.delete<ApiResponse<void>>(`/suppliers/${id}`),
}
