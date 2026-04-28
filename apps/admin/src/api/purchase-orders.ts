import { request } from './request'
import type { ApiResponse, PaginationResponse } from '@/types'

export enum PurchaseOrderStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  PROCESSING = 'processing',
  PARTIALLY_RECEIVED = 'partially_received',
  RECEIVED = 'received',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum PurchasePaymentStatus {
  UNPAID = 'unpaid',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  OVERDUE = 'overdue',
}


export interface PurchaseOrderItem {
  id?: number
  productId: number
  productName?: string
  productSku?: string
  quantity: number
  unitPrice: number
  receivedQuantity?: number
  notes?: string
}

export interface PurchaseOrder {
  id: number
  orderNumber: string
  supplierId: number
  supplierName?: string
  orderDate: string
  expectedDeliveryDate?: string
  status: PurchaseOrderStatus
  paymentStatus?: PurchasePaymentStatus
  paidAmount?: number
  taxRate?: number
  discountRate?: number
  discountAmount?: number
  shippingCost?: number
  subtotal: number
  taxAmount: number
  totalAmount: number
  notes?: string
  shippingAddress?: string
  paymentTerms?: string
  deliveryTerms?: string
  referenceNumber?: string
  items: PurchaseOrderItem[]
  createdAt: string
  updatedAt: string
}

export interface CreatePurchaseOrderDto {
  supplierId: number
  orderDate: string
  expectedDeliveryDate?: string
  status?: PurchaseOrderStatus
  taxRate?: number
  discountRate?: number
  discountAmount?: number
  shippingCost?: number
  notes?: string
  shippingAddress?: string
  paymentTerms?: string
  deliveryTerms?: string
  referenceNumber?: string
  items: Array<{
    productId: number
    quantity: number
    unitPrice: number
    notes?: string
  }>
}

export interface UpdatePurchaseOrderDto extends Partial<CreatePurchaseOrderDto> {}

export interface PurchaseOrderQuery {
  page?: number
  limit?: number
  status?: PurchaseOrderStatus
  supplierId?: number
  startDate?: string
  endDate?: string
  keyword?: string
}

// 報表查詢參數
export interface MonthlyPurchaseReportQuery {
  year: number
  month: number
  status?: PurchaseOrderStatus
}

export interface DateRangePurchaseReportQuery {
  startDate: string
  endDate: string
  status?: PurchaseOrderStatus
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
export interface PurchaseReportResponse {
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

// 進貨單 API
export const purchaseOrdersApi = {
  // 獲取進貨單列表
  getPurchaseOrders: (query?: PurchaseOrderQuery) =>
    request.get<PaginationResponse<PurchaseOrder>>('/purchase-orders', query),

  // 獲取進貨單詳情
  getPurchaseOrder: (id: number) =>
    request.get<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}`),

  // 獲取進貨統計
  getStatistics: () =>
    request.get<ApiResponse<any>>('/purchase-orders/statistics'),

  // 創建進貨單
  createPurchaseOrder: (data: CreatePurchaseOrderDto) =>
    request.post<ApiResponse<PurchaseOrder>>('/purchase-orders', data),

  // 更新進貨單
  updatePurchaseOrder: (id: number, data: UpdatePurchaseOrderDto) =>
    request.put<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}`, data),

  // 審批進貨單
  approvePurchaseOrder: (id: number) =>
    request.patch<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/approve`),

  // 取消進貨單
  cancelPurchaseOrder: (id: number, data: CancelOrderParams) =>
    request.patch<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/cancel`, data),

  // 退回進貨單
  revertPurchaseOrder: (id: number, data: RevertOrderParams) =>
    request.patch<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/revert`, data),

  // 接收貨物
  receiveItems: (id: number, items: Array<{ itemId: number; receivedQuantity: number }>) =>
    request.patch<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/receive`, { items }),

  // 登記付款
  // 切換付款狀態（true = 已付款 / false = 未付款）
  setPaymentStatus: (id: number, paid: boolean) =>
    request.patch<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/payment-status`, { paid }),

  // 獲取月度採購報表
  getMonthlyPurchaseReport: (query: MonthlyPurchaseReportQuery) =>
    request.get<ApiResponse<PurchaseReportResponse>>('/purchase-orders/report/monthly', query),

  // 獲取日期範圍採購報表
  getDateRangePurchaseReport: (query: DateRangePurchaseReportQuery) =>
    request.get<ApiResponse<PurchaseReportResponse>>('/purchase-orders/report/date-range', query),
}
