import type { BaseEntity } from './api.types'
import type { Product, Supplier, Customer } from './product.types'
import type { User } from './user.types'

// 訂單狀態枚舉
export enum OrderStatus {
  DRAFT = 'draft',           // 草稿
  PENDING = 'pending',       // 待審核
  APPROVED = 'approved',     // 已審核
  PROCESSING = 'processing', // 處理中
  SHIPPED = 'shipped',       // 已出貨
  DELIVERED = 'delivered',   // 已交付
  COMPLETED = 'completed',   // 已完成
  CANCELLED = 'cancelled',   // 已取消
  RETURNED = 'returned',     // 已退貨
}

// 訂單類型枚舉
export enum OrderType {
  PURCHASE = 'purchase',     // 進貨單
  SALE = 'sale',            // 銷貨單
  RETURN_PURCHASE = 'return_purchase', // 進貨退貨單
  RETURN_SALE = 'return_sale',         // 銷貨退貨單
}

// 付款狀態枚舉
export enum PaymentStatus {
  UNPAID = 'unpaid',         // 未付款
  PARTIAL = 'partial',       // 部分付款
  PAID = 'paid',            // 已付款
  OVERDUE = 'overdue',      // 逾期
  REFUNDED = 'refunded',    // 已退款
}

// 基礎訂單接口
export interface BaseOrder extends BaseEntity {
  orderNumber: string
  orderType: OrderType
  status: OrderStatus
  paymentStatus: PaymentStatus
  orderDate: Date
  expectedDate?: Date
  actualDate?: Date
  subtotal: number
  taxAmount: number
  discountAmount: number
  shippingAmount: number
  totalAmount: number
  notes?: string
  createdBy: number
  creator?: User
}

// 進貨單
export interface PurchaseOrder extends BaseOrder {
  orderType: OrderType.PURCHASE
  supplierId: number
  supplier?: Supplier
  items: PurchaseOrderItem[]
  receivedDate?: Date
  invoiceNumber?: string
}

// 銷貨單
export interface SaleOrder extends BaseOrder {
  orderType: OrderType.SALE
  customerId: number
  customer?: Customer
  items: SaleOrderItem[]
  shippingAddress?: string
  billingAddress?: string
  trackingNumber?: string
}

// 進貨單明細
export interface PurchaseOrderItem extends BaseEntity {
  purchaseOrderId: number
  purchaseOrder?: PurchaseOrder
  productId: number
  product?: Product
  quantity: number
  unitPrice: number
  totalPrice: number
  receivedQuantity?: number
  notes?: string
}

// 銷貨單明細
export interface SaleOrderItem extends BaseEntity {
  saleOrderId: number
  saleOrder?: SaleOrder
  productId: number
  product?: Product
  quantity: number
  unitPrice: number
  discount: number
  totalPrice: number
  shippedQuantity?: number
  notes?: string
}

// 訂單查詢參數
export interface OrderQuery {
  page?: number
  limit?: number
  search?: string
  orderType?: OrderType
  status?: OrderStatus
  paymentStatus?: PaymentStatus
  supplierId?: number
  customerId?: number
  dateFrom?: Date
  dateTo?: Date
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

// 訂單統計
export interface OrderStats {
  totalOrders: number
  pendingOrders: number
  completedOrders: number
  cancelledOrders: number
  totalAmount: number
  averageOrderValue: number
}

// 進貨統計
export interface PurchaseStats extends OrderStats {
  totalPurchases: number
  pendingPurchases: number
  totalPurchaseAmount: number
  topSuppliers: Array<{
    supplier: Supplier
    orderCount: number
    totalAmount: number
  }>
}

// 銷貨統計
export interface SaleStats extends OrderStats {
  totalSales: number
  pendingSales: number
  totalSalesAmount: number
  topCustomers: Array<{
    customer: Customer
    orderCount: number
    totalAmount: number
  }>
  topProducts: Array<{
    product: Product
    quantity: number
    totalAmount: number
  }>
}