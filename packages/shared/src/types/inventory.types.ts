import type { BaseEntity } from './api.types'
import type { Product } from './product.types'
import type { User } from './user.types'
import type { PurchaseOrder, SaleOrder } from './order.types'

// 庫存異動類型枚舉
export enum InventoryTransactionType {
  // 入庫類型
  PURCHASE_IN = 'purchase_in',           // 進貨入庫
  RETURN_IN = 'return_in',               // 退貨入庫
  ADJUSTMENT_IN = 'adjustment_in',       // 調整入庫
  TRANSFER_IN = 'transfer_in',           // 調撥入庫
  PRODUCTION_IN = 'production_in',       // 生產入庫
  
  // 出庫類型
  SALE_OUT = 'sale_out',                 // 銷貨出庫
  RETURN_OUT = 'return_out',             // 退貨出庫
  ADJUSTMENT_OUT = 'adjustment_out',     // 調整出庫
  TRANSFER_OUT = 'transfer_out',         // 調撥出庫
  DAMAGE_OUT = 'damage_out',             // 損耗出庫
  CONSUMPTION_OUT = 'consumption_out',   // 消耗出庫
}

// 庫存狀態枚舉
export enum InventoryStatus {
  NORMAL = 'normal',                     // 正常
  LOW_STOCK = 'low_stock',              // 低庫存
  OUT_OF_STOCK = 'out_of_stock',        // 缺貨
  OVERSTOCKED = 'overstocked',          // 庫存過多
  DAMAGED = 'damaged',                   // 已損壞
  RESERVED = 'reserved',                 // 已預留
}

// 庫存異動記錄
export interface InventoryTransaction extends BaseEntity {
  productId: number
  product?: Product
  type: InventoryTransactionType
  referenceType?: 'purchase_order' | 'sale_order' | 'adjustment' | 'transfer'
  referenceId?: number
  quantityBefore: number
  quantityChanged: number
  quantityAfter: number
  unitCost?: number
  totalCost?: number
  reason?: string
  notes?: string
  userId: number
  user?: User
  warehouseId?: number
  batchNumber?: string
  expiryDate?: Date
}

// 庫存快照（每日庫存記錄）
export interface InventorySnapshot extends BaseEntity {
  productId: number
  product?: Product
  snapshotDate: Date
  quantityOnHand: number
  quantityReserved: number
  quantityAvailable: number
  averageCost: number
  totalValue: number
  status: InventoryStatus
}

// 庫存調整單
export interface InventoryAdjustment extends BaseEntity {
  adjustmentNumber: string
  adjustmentDate: Date
  reason: string
  notes?: string
  totalItems: number
  totalAdjustmentValue: number
  status: 'draft' | 'approved' | 'completed'
  items: InventoryAdjustmentItem[]
  createdBy: number
  creator?: User
  approvedBy?: number
  approver?: User
  approvedAt?: Date
}

// 庫存調整明細
export interface InventoryAdjustmentItem extends BaseEntity {
  adjustmentId: number
  adjustment?: InventoryAdjustment
  productId: number
  product?: Product
  quantityBefore: number
  quantityAfter: number
  quantityChanged: number
  unitCost: number
  totalCost: number
  reason?: string
  notes?: string
}

// 庫存轉移/調撥
export interface InventoryTransfer extends BaseEntity {
  transferNumber: string
  transferDate: Date
  fromWarehouse?: string
  toWarehouse?: string
  reason: string
  notes?: string
  totalItems: number
  status: 'draft' | 'in_transit' | 'completed' | 'cancelled'
  items: InventoryTransferItem[]
  createdBy: number
  creator?: User
  approvedBy?: number
  approver?: User
  completedAt?: Date
}

// 庫存轉移明細
export interface InventoryTransferItem extends BaseEntity {
  transferId: number
  transfer?: InventoryTransfer
  productId: number
  product?: Product
  quantityTransferred: number
  quantityReceived?: number
  unitCost: number
  notes?: string
}

// 庫存查詢參數
export interface InventoryQuery {
  page?: number
  limit?: number
  search?: string
  productId?: number
  categoryId?: number
  status?: InventoryStatus
  warehouseId?: number
  lowStock?: boolean
  outOfStock?: boolean
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

// 庫存統計
export interface InventoryStats {
  totalProducts: number
  totalQuantity: number
  totalValue: number
  lowStockProducts: number
  outOfStockProducts: number
  categoryBreakdown: Array<{
    categoryName: string
    productCount: number
    totalQuantity: number
    totalValue: number
  }>
  warehouseBreakdown?: Array<{
    warehouseName: string
    productCount: number
    totalQuantity: number
    totalValue: number
  }>
}

// 庫存預警配置
export interface InventoryAlert {
  id: number
  productId: number
  product?: Product
  alertType: 'low_stock' | 'out_of_stock' | 'overstock'
  threshold: number
  isActive: boolean
  lastTriggered?: Date
  createdAt: Date
}

// 庫存報表數據
export interface InventoryReport {
  reportDate: Date
  productId: number
  product?: Product
  openingStock: number
  purchaseIn: number
  saleOut: number
  adjustmentIn: number
  adjustmentOut: number
  transferIn: number
  transferOut: number
  closingStock: number
  averageCost: number
  totalValue: number
}