import { request } from './request'
import type { ApiResponse, PaginationResponse } from '@/types'

export enum SaleOrderStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface SaleOrderItem {
  id?: number
  productId: number
  productName?: string
  productSku?: string
  quantity: number
  unitPrice: number
  discountRate?: number
  discountAmount?: number
  shippedQuantity?: number
  notes?: string
}

export interface SaleOrder {
  id: number
  orderNumber: string
  customerId: number
  customerName?: string
  orderDate: string
  expectedShippingDate?: string
  expectedDeliveryDate?: string
  actualShippingDate?: string
  actualDeliveryDate?: string
  status: SaleOrderStatus
  taxRate?: number
  discountRate?: number
  discountAmount?: number
  shippingCost?: number
  subtotal: number
  taxAmount: number
  totalAmount: number
  notes?: string
  shippingAddress?: string
  billingAddress?: string
  paymentMethod?: string
  shippingMethod?: string
  trackingNumber?: string
  referenceNumber?: string
  items: SaleOrderItem[]
  createdAt: string
  updatedAt: string
}

export interface CreateSaleOrderDto {
  customerId: number
  orderDate: string
  expectedShippingDate?: string
  expectedDeliveryDate?: string
  status?: SaleOrderStatus
  taxRate?: number
  discountRate?: number
  discountAmount?: number
  shippingCost?: number
  notes?: string
  shippingAddress?: string
  billingAddress?: string
  paymentMethod?: string
  shippingMethod?: string
  referenceNumber?: string
  items: Array<{
    productId: number
    quantity: number
    unitPrice: number
    discountRate?: number
    discountAmount?: number
    notes?: string
  }>
}

export interface UpdateSaleOrderDto extends Partial<CreateSaleOrderDto> {}

export interface SaleOrderQuery {
  page?: number
  limit?: number
  status?: SaleOrderStatus
  customerId?: number
  startDate?: string
  endDate?: string
  keyword?: string
}

// 報表查詢參數
export interface MonthlySalesReportQuery {
  year: number
  month: number
  status?: SaleOrderStatus
}

export interface DateRangeSalesReportQuery {
  startDate: string
  endDate: string
  status?: SaleOrderStatus
}

// 取消訂單參數
export interface CancelOrderParams {
  reason: string
  adjustInventory?: boolean
}

// 退回訂單參數
export interface RevertOrderParams {
  reason?: string
}

// 報表響應數據
export interface SalesReportResponse {
  period: {
    start: string
    end: string
    label: string
  }
  summary: {
    totalAmount: number
    totalOrders: number
    avgOrderValue: number
    completedOrders: number
    completedAmount: number
  }
  trend: Array<{
    date: string
    amount: number
    orderCount: number
    avgAmount: number
  }>
  statusBreakdown: Array<{
    status: string
    count: number
    amount: number
    percentage: number
  }>
}

// 銷貨單 API
export const saleOrdersApi = {
  // 獲取銷貨單列表
  getSaleOrders: (query?: SaleOrderQuery) =>
    request.get<PaginationResponse<SaleOrder>>('/sale-orders', query),

  // 獲取銷貨單詳情
  getSaleOrder: (id: number) =>
    request.get<ApiResponse<SaleOrder>>(`/sale-orders/${id}`),

  // 獲取銷售統計
  getStatistics: () =>
    request.get<ApiResponse<any>>('/sale-orders/statistics'),

  // 創建銷貨單
  createSaleOrder: (data: CreateSaleOrderDto) =>
    request.post<ApiResponse<SaleOrder>>('/sale-orders', data),

  // 更新銷貨單
  updateSaleOrder: (id: number, data: UpdateSaleOrderDto) =>
    request.put<ApiResponse<SaleOrder>>(`/sale-orders/${id}`, data),

  // 提交銷貨單（草稿 → 待確認）
  submitSaleOrder: (id: number) =>
    request.patch<ApiResponse<SaleOrder>>(`/sale-orders/${id}/submit`),

  // 確認銷貨單
  confirmSaleOrder: (id: number) =>
    request.patch<ApiResponse<SaleOrder>>(`/sale-orders/${id}/confirm`),

  // 取消銷貨單
  cancelSaleOrder: (id: number, data: CancelOrderParams) =>
    request.patch<ApiResponse<SaleOrder>>(`/sale-orders/${id}/cancel`, data),

  // 退回銷貨單
  revertSaleOrder: (id: number, data: RevertOrderParams) =>
    request.patch<ApiResponse<SaleOrder>>(`/sale-orders/${id}/revert`, data),

  // 出貨
  shipItems: (id: number, items: Array<{ itemId: number; shippedQuantity: number }>) =>
    request.patch<ApiResponse<SaleOrder>>(`/sale-orders/${id}/ship`, { items }),

  // 更新物流信息
  updateShippingInfo: (id: number, data: { trackingNumber?: string; shippingMethod?: string }) =>
    request.patch<ApiResponse<SaleOrder>>(`/sale-orders/${id}/shipping-info`, data),

  // 標記為已送達
  markDelivered: (id: number) =>
    request.patch<ApiResponse<SaleOrder>>(`/sale-orders/${id}/delivered`),

  // 完成訂單
  completeSaleOrder: (id: number) =>
    request.patch<ApiResponse<SaleOrder>>(`/sale-orders/${id}/complete`),

  // 獲取月度銷售報表
  getMonthlySalesReport: (query: MonthlySalesReportQuery) =>
    request.get<ApiResponse<SalesReportResponse>>('/sale-orders/report/monthly', query),

  // 獲取日期範圍銷售報表
  getDateRangeSalesReport: (query: DateRangeSalesReportQuery) =>
    request.get<ApiResponse<SalesReportResponse>>('/sale-orders/report/date-range', query),
}
