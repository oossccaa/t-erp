import { request } from './request'
import type { ApiResponse, Customer } from '@t-erp/shared'

export interface CreateCustomerDto {
  name: string
  contactPerson?: string
  phone?: string
  email?: string
  address?: string
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {}

// 客戶 API
export const customersApi = {
  // 獲取客戶列表
  getCustomers: (search?: string) =>
    request.get<ApiResponse<Customer[]>>('/customers', { search }),

  // 獲取啟用的客戶列表
  getActiveCustomers: () =>
    request.get<ApiResponse<Customer[]>>('/customers/active'),

  // 獲取客戶統計信息
  getCustomerStats: () =>
    request.get<ApiResponse<any>>('/customers/stats'),

  // 獲取客戶詳情
  getCustomer: (id: number) =>
    request.get<ApiResponse<Customer>>(`/customers/${id}`),

  // 創建客戶
  createCustomer: (data: CreateCustomerDto) =>
    request.post<ApiResponse<Customer>>('/customers', data),

  // 更新客戶
  updateCustomer: (id: number, data: UpdateCustomerDto) =>
    request.patch<ApiResponse<Customer>>(`/customers/${id}`, data),

  // 切換客戶狀態
  toggleCustomerStatus: (id: number) =>
    request.patch<ApiResponse<Customer>>(`/customers/${id}/toggle-status`),

  // 刪除客戶
  deleteCustomer: (id: number) =>
    request.delete<ApiResponse<void>>(`/customers/${id}`),
}
