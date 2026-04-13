import type { BaseEntity } from './api.types'
import type { Product } from './product.types'
import type { User } from './user.types'

export enum InventoryTransactionType {
  PURCHASE_IN = 'purchase_in',
  RETURN_IN = 'return_in',
  ADJUSTMENT_IN = 'adjustment_in',
  TRANSFER_IN = 'transfer_in',
  PRODUCTION_IN = 'production_in',
  SALE_OUT = 'sale_out',
  RETURN_OUT = 'return_out',
  ADJUSTMENT_OUT = 'adjustment_out',
  TRANSFER_OUT = 'transfer_out',
  DAMAGE_OUT = 'damage_out',
  CONSUMPTION_OUT = 'consumption_out',
}

export enum InventoryStatus {
  NORMAL = 'normal',
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
  OVERSTOCKED = 'overstocked',
  DAMAGED = 'damaged',
  RESERVED = 'reserved',
}

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
