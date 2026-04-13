import type { BaseEntity } from './api.types'
import type { Product, Supplier, Customer } from './product.types'
import type { User } from './user.types'

export enum OrderStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
}

export enum OrderType {
  PURCHASE = 'purchase',
  SALE = 'sale',
  RETURN_PURCHASE = 'return_purchase',
  RETURN_SALE = 'return_sale',
}

export enum PaymentStatus {
  UNPAID = 'unpaid',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue',
  REFUNDED = 'refunded',
}

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

export interface PurchaseOrder extends BaseOrder {
  orderType: OrderType.PURCHASE
  supplierId: number
  supplier?: Supplier
  items: PurchaseOrderItem[]
  receivedDate?: Date
  invoiceNumber?: string
}

export interface SaleOrder extends BaseOrder {
  orderType: OrderType.SALE
  customerId: number
  customer?: Customer
  items: SaleOrderItem[]
  shippingAddress?: string
  billingAddress?: string
  trackingNumber?: string
}

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

export interface OrderStats {
  totalOrders: number
  pendingOrders: number
  completedOrders: number
  cancelledOrders: number
  totalAmount: number
  averageOrderValue: number
}

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
