import { request } from './request'
import type { ApiResponse, PaginationResponse } from '@t-erp/shared'

export enum InventoryTransactionType {
  PURCHASE = 'purchase',
  SALE = 'sale',
  ADJUSTMENT = 'adjustment',
  RETURN = 'return',
  TRANSFER = 'transfer',
}

export enum InventoryAdjustmentStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface InventoryTransaction {
  id: number
  productId: number
  productName?: string
  type: InventoryTransactionType
  quantity: number
  beforeQuantity: number
  afterQuantity: number
  unitCost?: number
  referenceType?: string
  referenceId?: number
  notes?: string
  createdAt: string
}

export interface InventoryAdjustmentItem {
  id?: number
  productId: number
  productName?: string
  productSku?: string
  systemQuantity: number
  actualQuantity: number
  difference: number
  unitCost?: number
  batchNumber?: string
  expiryDate?: string
  location?: string
  reason?: string
  notes?: string
}

export interface InventoryAdjustment {
  id: number
  adjustmentNumber: string
  type: string
  adjustmentDate: string
  warehouse?: string
  status: InventoryAdjustmentStatus
  reason?: string
  notes?: string
  totalDifference: number
  createdBy?: number
  approvedBy?: number
  approvedAt?: string
  items: InventoryAdjustmentItem[]
  createdAt: string
  updatedAt: string
}

export interface InventoryStats {
  totalProducts: number
  totalValue: number
  lowStockProducts: number
  outOfStockProducts: number
}

export interface CreateInventoryAdjustmentDto {
  type: string
  adjustmentDate: string
  warehouse?: string
  reason?: string
  notes?: string
  items: Array<{
    productId: number
    systemQuantity: number
    actualQuantity: number
    unitCost?: number
    batchNumber?: string
    expiryDate?: string
    location?: string
    reason?: string
    notes?: string
  }>
}

export interface InventoryQuery {
  warehouse?: string
  categoryId?: number
  lowStockOnly?: boolean
}

export interface TransactionQuery {
  startDate?: string
  endDate?: string
  type?: InventoryTransactionType
  page?: number
  limit?: number
}

export interface AdjustmentQuery {
  status?: InventoryAdjustmentStatus
  type?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

// 報表查詢參數和響應
export interface InventoryTrendQuery {
  startDate: string
  endDate: string
}

export interface TopProductsQuery {
  limit?: number
  sortBy?: 'stockQuantity' | 'stockValue' | 'turnover'
}

export interface InventorySummaryResponse {
  totalProducts: number
  totalStockQuantity: number
  totalStockValue: number
  lowStockCount: number
  outOfStockCount: number
}

export interface InventoryTrendResponse {
  period: {
    start: string
    end: string
  }
  trend: Array<{
    date: string
    inboundQuantity: number
    outboundQuantity: number
    netChange: number
  }>
}

export interface TopProductsResponse {
  sortBy: string
  products: Array<{
    productId: number
    productName: string
    productSku: string
    stockQuantity: number
    stockValue: number
    unitCost: number
  }>
}

// 庫存管理 API
export const inventoryApi = {
  // 獲取庫存統計
  getStats: (query?: InventoryQuery) =>
    request.get<ApiResponse<InventoryStats>>('/inventory/stats', query),

  // 獲取產品庫存異動記錄
  getProductTransactions: (productId: number, query?: TransactionQuery) =>
    request.get<PaginationResponse<InventoryTransaction>>(
      `/inventory/transactions/product/${productId}`,
      query
    ),

  // 創建庫存調整單
  createAdjustment: (data: CreateInventoryAdjustmentDto) =>
    request.post<ApiResponse<InventoryAdjustment>>('/inventory/adjustments', data),

  // 獲取調整單列表
  getAdjustments: (query?: AdjustmentQuery) =>
    request.get<PaginationResponse<InventoryAdjustment>>('/inventory/adjustments', query),

  // 審批調整單
  approveAdjustment: (id: number) =>
    request.patch<ApiResponse<InventoryAdjustment>>(`/inventory/adjustments/${id}/approve`),

  // 獲取庫存彙總報表
  getInventorySummary: () =>
    request.get<ApiResponse<InventorySummaryResponse>>('/inventory/report/summary'),

  // 獲取庫存趨勢報表
  getInventoryTrend: (query: InventoryTrendQuery) =>
    request.get<ApiResponse<InventoryTrendResponse>>('/inventory/report/trend', query),

  // 獲取商品排行榜
  getTopProducts: (query?: TopProductsQuery) =>
    request.get<ApiResponse<TopProductsResponse>>('/inventory/report/top-products', query),
}
